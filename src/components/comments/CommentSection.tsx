import React, { useState, useEffect, useCallback } from "react";
import { Heart, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Skeleton } from "../ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { commentsApi, authApi, likesApi } from "../../api";
import type { Comment, User } from "../../types";
import { timeAgo, cn } from "../../utils";

interface CommentItemProps {
  comment: Comment;
  onDeleted: (id: number) => void;
  depth?: number;
}

function CommentItem({ comment, onDeleted, depth = 0 }: CommentItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [author, setAuthor] = useState<User | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likesCount);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  useEffect(() => {
    authApi
      .getProfile(comment.authorId)
      .then(setAuthor)
      .catch(() => {});
  }, [comment.authorId]);

  const handleLikeComment = async () => {
    if (!user) return;
    try {
      if (liked) {
        await commentsApi.unlikeComment(comment.commentId);
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await commentsApi.likeComment(comment.commentId);
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch {
      toast.error("Failed to update like");
    }
  };

  const loadReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }
    setLoadingReplies(true);
    try {
      const data = await commentsApi.getReplies(comment.commentId);
      setReplies(data);
      setShowReplies(true);
    } catch {
      toast.error("Failed to load replies");
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !user) return;
    setSubmitting(true);
    try {
      const reply = await commentsApi.addReply(comment.commentId, {
        postId: comment.postId,
        content: replyText.trim(),
      });
      setReplies((prev) => [...prev, reply]);
      setShowReplies(true);
      setReplyText("");
      setShowReplyInput(false);
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    try {
      await commentsApi.deleteComment(comment.commentId);
      onDeleted(comment.commentId);
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const isOwner = user?.userId === comment.authorId;

  return (
    <div className={cn("flex gap-2.5", depth > 0 && "ml-8")}>
      <Avatar
        src={author?.profilePicUrl}
        name={author?.fullName || author?.username}
        size="xs"
      />
      <div className="flex-1 min-w-0">
        <div className="bg-surface rounded-xl px-3 py-2 inline-block max-w-full">
          <span className="text-xs font-semibold text-brand-400 mr-1">
            @{author?.username || "..."}
          </span>
          <span className="text-xs text-foreground/90 break-words">
            {comment.content}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-[11px] text-muted-foreground">
            {timeAgo(comment.createdAt)}
          </span>
          <button
            onClick={handleLikeComment}
            className={cn(
              "flex items-center gap-1 text-[11px] font-medium transition-colors",
              liked
                ? "text-rose-400"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Heart className={cn("w-3 h-3", liked && "fill-current")} />
            {likeCount > 0 && likeCount}
          </button>
          {user && depth === 0 && (
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Reply
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              className="text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              Delete
            </button>
          )}
          {depth === 0 && (
            <button
              onClick={loadReplies}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-brand-400 transition-colors"
              disabled={loadingReplies}
            >
              {loadingReplies ? (
                <span className="animate-pulse">Loading...</span>
              ) : showReplies ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Hide replies
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Replies
                </>
              )}
            </button>
          )}
        </div>

        {/* Reply input */}
        {showReplyInput && (
          <div className="flex gap-2 mt-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
              placeholder="Write a reply..."
              className="flex-1 text-xs bg-surface border border-border rounded-xl px-3 py-1.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-500/60"
              autoFocus
            />
            <button
              onClick={handleReply}
              disabled={!replyText.trim() || submitting}
              className="px-3 py-1.5 text-xs font-semibold bg-brand-gradient text-white rounded-xl disabled:opacity-50 transition-all hover:brightness-110"
            >
              {submitting ? "..." : "Reply"}
            </button>
          </div>
        )}

        {/* Nested replies */}
        {showReplies && replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {replies.map((reply) => (
              <CommentItem
                key={reply.commentId}
                comment={reply}
                onDeleted={(id) =>
                  setReplies((r) => r.filter((c) => c.commentId !== id))
                }
                depth={1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentSectionProps {
  postId: number;
  onCommentAdded?: () => void;
}

export function CommentSection({
  postId,
  onCommentAdded,
}: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    commentsApi
      .getCommentsByPost(postId)
      .then((data) => setComments(data.filter((c) => !c.parentCommentId)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async () => {
    if (!text.trim() || !user) return;
    setSubmitting(true);
    try {
      const comment = await commentsApi.addComment({
        postId,
        content: text.trim(),
      });
      setComments((prev) => [comment, ...prev]);
      setText("");
      onCommentAdded?.();
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleted = (id: number) => {
    setComments((prev) => prev.filter((c) => c.commentId !== id));
  };

  return (
    <div className="px-5 py-4 space-y-3">
      {user && (
        <div className="flex gap-2.5">
          <Avatar
            src={user.profilePicUrl}
            name={user.fullName || user.username}
            size="xs"
          />
          <div className="flex-1 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Add a comment…"
              className="flex-1 text-xs bg-surface border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/20"
            />
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="px-3 py-2 text-xs font-semibold bg-brand-gradient text-white rounded-xl disabled:opacity-50 transition-all hover:brightness-110"
            >
              {submitting ? "..." : "Post"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2.5">
              <Skeleton className="w-6 h-6 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-8 w-3/4 rounded-xl" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <CommentItem
              key={c.commentId}
              comment={c}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
