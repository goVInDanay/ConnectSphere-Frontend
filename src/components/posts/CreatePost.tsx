import React, { useState, useRef } from "react";
import { Image, Globe, Users, Lock, X, Loader2 } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { postsApi, mediaApi } from "../../api";
import type { Post, Visibility } from "../../types";
import { buildMediaUrl, cn } from "../../utils";

interface CreatePostProps {
  onCreated: (post: Post) => void;
}

const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "PUBLIC", label: "Public", icon: <Globe className="w-3.5 h-3.5" /> },
  {
    value: "FOLLOWERS",
    label: "Followers",
    icon: <Users className="w-3.5 h-3.5" />,
  },
  {
    value: "PRIVATE",
    label: "Only me",
    icon: <Lock className="w-3.5 h-3.5" />,
  },
];

export function CreatePost({ onCreated }: CreatePostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [focused, setFocused] = useState(false);

  if (!user) return null;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length + mediaFiles.length > 4) {
      toast.warning("Maximum 4 media files per post");
      return;
    }
    const newFiles = selected.slice(0, 4 - mediaFiles.length);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setMediaFiles((prev) => [...prev, ...newFiles]);
    setMediaPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles((f) => f.filter((_, i) => i !== index));
    setMediaPreviews((p) => p.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      // Upload media first
      const mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        for (let i = 0; i < mediaFiles.length; i++) {
          const media = await mediaApi.uploadMedia(mediaFiles[i]);
          mediaUrls.push(media.url);
          setUploadProgress(Math.round(((i + 1) / mediaFiles.length) * 80));
        }
      }

      const post = await postsApi.createPost({
        authorId: user.userId,
        content: content.trim(),
        mediaUrls,
        postType: mediaUrls.length > 0 ? "MEDIA" : "TEXT",
        visibility,
      });

      setUploadProgress(100);
      onCreated(post);
      setContent("");
      setMediaFiles([]);
      setMediaPreviews([]);
      setVisibility("PUBLIC");
      setFocused(false);
      toast.success("Post published!");
    } catch {
      toast.error("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const currentVisibility = VISIBILITY_OPTIONS.find(
    (v) => v.value === visibility,
  )!;
  const charCount = content.length;
  const maxChars = 5000;

  return (
    <div
      className={cn(
        "bg-card border rounded-2xl transition-all duration-300",
        focused ? "border-brand-500/40 shadow-glow-sm" : "border-border",
      )}
    >
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar
            src={user.profilePicUrl}
            name={user.fullName || user.username}
            size="sm"
            ring
          />
          <div className="flex-1 min-w-0">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="What's on your mind?"
              className={cn(
                "w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60",
                "resize-none focus:outline-none leading-relaxed",
                focused || content ? "min-h-[80px]" : "min-h-[36px]",
                "transition-all duration-200",
              )}
              maxLength={maxChars}
            />

            {/* Media previews */}
            {mediaPreviews.length > 0 && (
              <div
                className={cn(
                  "grid gap-2 mt-3",
                  mediaPreviews.length === 1 && "grid-cols-1",
                  mediaPreviews.length >= 2 && "grid-cols-2",
                )}
              >
                {mediaPreviews.map((src, i) => (
                  <div
                    key={i}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-surface"
                  >
                    <img
                      src={src}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {isSubmitting && uploadProgress > 0 && (
        <div className="px-4 pb-2">
          <div className="h-1 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-gradient rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer controls */}
      {(focused || content || mediaPreviews.length > 0) && (
        <div className="flex items-center justify-between px-4 pb-4 pt-1 border-t border-border/40">
          <div className="flex items-center gap-1">
            {/* Media upload */}
            <button
              onClick={() => fileRef.current?.click()}
              className="p-2 rounded-lg text-muted-foreground hover:text-brand-400 hover:bg-brand-500/10 transition-all"
              title="Add photos or videos"
            >
              <Image className="w-4 h-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFiles}
              className="hidden"
            />

            {/* Visibility picker */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all">
                {currentVisibility.icon}
                <span>{currentVisibility.label}</span>
              </button>
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block w-36 bg-card border border-border rounded-xl shadow-card z-20 overflow-hidden">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setVisibility(opt.value)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium transition-colors",
                      visibility === opt.value
                        ? "text-brand-400 bg-brand-500/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-hover",
                    )}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Character count */}
            {charCount > maxChars * 0.7 && (
              <span
                className={cn(
                  "text-xs",
                  charCount > maxChars * 0.9
                    ? "text-rose-400"
                    : "text-muted-foreground",
                )}
              >
                {maxChars - charCount}
              </span>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              isLoading={isSubmitting}
              size="sm"
            >
              Post
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
