import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Edit,
  Globe,
  Users,
  Lock,
  Repeat2,
} from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { postsApi, likesApi, authApi } from "../../api";
import type { Post, User, ReactionType } from "../../types";
import {
  timeAgo,
  formatCount,
  REACTION_EMOJIS,
  cn,
  buildMediaUrl,
} from "../../utils";
import { CommentSection } from "../comments/CommentSection";

const REACTIONS: { type: ReactionType; emoji: string }[] = [
  { type: "LIKE", emoji: "👍" },
  { type: "LOVE", emoji: "❤️" },
  { type: "HAHA", emoji: "😂" },
  { type: "WOW", emoji: "😮" },
  { type: "SAD", emoji: "😢" },
  { type: "ANGRY", emoji: "😠" },
];

const VISIBILITY_ICONS = {
  PUBLIC: <Globe className="w-3 h-3" />,
  FOLLOWERS: <Users className="w-3 h-3" />,
  PRIVATE: <Lock className="w-3 h-3" />,
};

interface PostCardProps {
  post: Post;
  onDeleted?: (postId: number) => void;
  onUpdated?: (post: Post) => void;
}

export function PostCard({ post, onDeleted, onUpdated }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [author, setAuthor] = useState<User | null>(null);
  const [likeCount, setLikeCount] = useState(post.likesCount);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentsCount);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .getProfile(post.authorId)
      .then(setAuthor)
      .catch(() => {});
    if (user) {
      likesApi
        .getUserReaction("POST", post.postId)
        .then((like) => {
          setUserReaction(like?.reactionType ?? null);
        })
        .catch(() => {});
    }
  }, [post.authorId, post.postId, user]);

  const handleReact = useCallback(
    async (type: ReactionType) => {
      if (!user) {
        toast.error("Please sign in to react");
        return;
      }
      setShowReactionPicker(false);
      try {
        if (userReaction === type) {
          // Toggle off
          await likesApi.unlikeTarget(post.postId, "POST");
          setUserReaction(null);
          setLikeCount((c) => Math.max(0, c - 1));
        } else if (userReaction) {
          // Change reaction
          await likesApi.changeReaction(post.postId, "POST", type);
          setUserReaction(type);
        } else {
          // New reaction
          await likesApi.likeTarget(post.postId, "POST", type);
          setUserReaction(type);
          setLikeCount((c) => c + 1);
        }
      } catch {
        toast.error("Could not update reaction");
      }
    },
    [user, userReaction, post.postId, toast],
  );

  const handleQuickLike = useCallback(() => {
    if (!user) {
      toast.error("Please sign in");
      return;
    }
    handleReact("LIKE");
  }, [user, handleReact, toast]);

  const handleDelete = async () => {
    setShowMenu(false);
    if (!confirm("Delete this post?")) return;
    try {
      await postsApi.deletePost(post.postId);
      toast.success("Post deleted");
      onDeleted?.(post.postId);
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/post/${post.postId}`,
    );
    toast.success("Link copied to clipboard");
  };

  const isOwner = user?.userId === post.authorId;
  const reactionEmoji = userReaction ? REACTION_EMOJIS[userReaction] : null;

  return (
    <article className="post-card bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <Link
          to={`/profile/${post.authorId}`}
          className="flex items-center gap-3 group"
        >
          <Avatar
            src={author?.profilePicUrl}
            name={author?.fullName || author?.username}
            size="sm"
            ring
          />
          <div>
            <p className="text-sm font-semibold text-foreground group-hover:text-brand-400 transition-colors">
              {author?.fullName || author?.username || "..."}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>@{author?.username}</span>
              <span>·</span>
              <span>{timeAgo(post.createdAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                {VISIBILITY_ICONS[post.visibility]}
              </span>
            </div>
          </div>
        </Link>

        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 glass border border-border rounded-xl shadow-card z-20 overflow-hidden animate-fade-in">
                <Link
                  to={`/posts/${post.postId}/edit`}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-surface-hover transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit post
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pb-3">
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
          {post.content}
        </p>
      </div>

      {/* Media */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div
          className={cn(
            "px-5 pb-3 grid gap-1.5",
            post.mediaUrls.length === 1 && "grid-cols-1",
            post.mediaUrls.length === 2 && "grid-cols-2",
            post.mediaUrls.length >= 3 && "grid-cols-2",
          )}
        >
          {post.mediaUrls.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className={cn(
                "relative overflow-hidden rounded-xl bg-surface",
                post.mediaUrls.length === 1 ? "aspect-video" : "aspect-square",
                post.mediaUrls.length === 3 && i === 0 && "row-span-2",
              )}
            >
              <img
                src={buildMediaUrl(url)}
                alt={`media-${i}`}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 cursor-zoom-in"
                loading="lazy"
                onClick={() => setSelectedImage(buildMediaUrl(url))}
              />
              {i === 3 && post.mediaUrls.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    +{post.mediaUrls.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 pb-3 pt-1 border-t border-border/40">
        {/* Like with reaction picker */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowReactionPicker(true)}
            onMouseLeave={() => setShowReactionPicker(false)}
            onClick={handleQuickLike}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              userReaction
                ? "text-rose-400 bg-rose-500/10 hover:bg-rose-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-hover",
            )}
          >
            {reactionEmoji ? (
              <span className="text-base leading-none">{reactionEmoji}</span>
            ) : (
              <Heart
                className={cn("w-4 h-4", userReaction && "fill-current")}
              />
            )}
            <span>{formatCount(likeCount)}</span>
          </button>

          {/* Reaction picker popup */}
          {showReactionPicker && (
            <div
              className="absolute bottom-full left-0 mb-2 flex items-center gap-1 p-2 glass border border-border rounded-2xl shadow-card z-30 reaction-popup"
              onMouseEnter={() => setShowReactionPicker(true)}
              onMouseLeave={() => setShowReactionPicker(false)}
            >
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  onClick={() => handleReact(r.type)}
                  className={cn(
                    "text-xl transition-all duration-150 hover:scale-125 p-1 rounded-lg",
                    userReaction === r.type && "scale-110 bg-surface-hover",
                  )}
                  title={r.type}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
            showComments
              ? "text-brand-400 bg-brand-500/10"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-hover",
          )}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{formatCount(commentCount)}</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-border/40">
          <CommentSection
            postId={post.postId}
            onCommentAdded={() => setCommentCount((c) => c + 1)}
          />
        </div>
      )}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-5xl w-full px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="full"
              className="w-full h-auto max-h-[90vh] object-contain rounded-xl"
            />

            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 bg-black/70 text-white p-2 rounded-full hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
