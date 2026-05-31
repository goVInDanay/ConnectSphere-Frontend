import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Users, Lock } from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { postsApi } from "../api";
import type { Post, Visibility } from "../types";
import { getErrorMessage, cn } from "../utils";

const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "PUBLIC", label: "Public", icon: <Globe className="w-4 h-4" /> },
  {
    value: "FOLLOWERS",
    label: "Followers only",
    icon: <Users className="w-4 h-4" />,
  },
  { value: "PRIVATE", label: "Only me", icon: <Lock className="w-4 h-4" /> },
];

export default function EditPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [content, setContent] = useState<string>("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!postId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    postsApi
      .getPost(parseInt(postId, 10))
      .then((p) => {
        if (p.authorId !== user?.userId) {
          toast.error("You can only edit your own posts");
          navigate(-1);
          return;
        }
        setPost(p);
        setContent(p.content ?? "");
        setVisibility(p.visibility ?? "PUBLIC");
      })
      .catch(() => {
        setNotFound(true);
        toast.error("Post not found");
      })
      .finally(() => setLoading(false));
  }, [postId, user?.userId]);

  const handleSave = async () => {
    if (!post || !content.trim()) return;
    setSaving(true);
    try {
      await postsApi.updatePost(post.postId, { content: content.trim() });
      if (visibility !== post.visibility) {
        await postsApi.changeVisibility(post.postId, { visibility });
      }
      toast.success("Post updated!");
      navigate(-1);
    } catch (err) {
      toast.error("Update failed", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface rounded w-32" />
          <div className="h-40 bg-surface rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  // Post not found
  if (notFound || !post) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Post not found.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Editor
  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Edit post</h1>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[140px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none leading-relaxed"
            placeholder="What's on your mind?"
            maxLength={5000}
          />
          <div className="text-xs text-muted-foreground text-right">
            {(content ?? "").length}/5000
          </div>

          <div className="border-t border-border/40 pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Visibility
            </p>
            <div className="flex gap-2 flex-wrap">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setVisibility(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                    visibility === opt.value
                      ? "bg-brand-500/10 border-brand-500/40 text-brand-400"
                      : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground",
                  )}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              size="sm"
              isLoading={saving}
              onClick={handleSave}
              disabled={!content.trim() || saving}
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
