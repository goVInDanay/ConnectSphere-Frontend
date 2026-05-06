import React, { useState, useEffect, useRef } from "react";
import { Film, Plus, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { storiesApi, followsApi, authApi } from "../api";
import type { Story, User } from "../types";
import { timeAgo, cn, buildMediaUrl } from "../utils";

interface StoryGroup {
  userId: number;
  author: User | null;
  stories: Story[];
}

export default function StoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StoryGroup | null>(null);
  const [selectedStoryIdx, setSelectedStoryIdx] = useState(0);

  useEffect(() => {
    loadStories();
  }, [user]);

  const loadStories = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const followeeIds = await followsApi.getFolloweeIds();
      const authorIds = [...new Set([user.userId, ...followeeIds])];
      const stories = await storiesApi.getStoriesFeed(authorIds);

      const map = new Map<number, Story[]>();
      stories.forEach((s) => {
        if (!map.has(s.authorId)) map.set(s.authorId, []);
        map.get(s.authorId)!.push(s);
      });

      const grouped: StoryGroup[] = await Promise.all(
        Array.from(map.entries()).map(async ([uid, strs]) => {
          const author = await authApi.getProfile(uid).catch(() => null);
          return { userId: uid, author, stories: strs };
        }),
      );
      grouped.sort((a, b) =>
        a.userId === user.userId ? -1 : b.userId === user.userId ? 1 : 0,
      );
      setGroups(grouped);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      await storiesApi.createStory(file);
      toast.success("Story posted!");
      loadStories();
    } catch {
      toast.error("Failed to upload story");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStory = async (storyId: number) => {
    try {
      await storiesApi.deleteStory(storyId);
      toast.success("Story deleted");
      setGroups((prev) =>
        prev
          .map((g) => ({
            ...g,
            stories: g.stories.filter((s) => s.storyId !== storyId),
          }))
          .filter((g) => g.stories.length > 0),
      );
      if (selectedGroup) {
        const updated = selectedGroup.stories.filter(
          (s) => s.storyId !== storyId,
        );
        if (updated.length === 0) setSelectedGroup(null);
        else setSelectedGroup({ ...selectedGroup, stories: updated });
      }
    } catch {
      toast.error("Failed to delete story");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl font-bold text-foreground">Stories</h1>
          </div>
          {user && (
            <>
              <Button
                size="sm"
                isLoading={uploading}
                onClick={() => fileRef.current?.click()}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Story
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleUpload}
                className="hidden"
              />
            </>
          )}
        </div>

        {!user ? (
          <div className="text-center py-20">
            <Film className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">
              Sign in to see stories
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Stories are only visible to logged-in users.
            </p>
            <Link to="/login">
              <Button>Sign in</Button>
            </Link>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[9/16] rounded-2xl bg-surface animate-pulse"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4 animate-float">
              <Film className="w-9 h-9 text-brand-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              No stories yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Be the first to share a story, or follow more people to see
              theirs.
            </p>
            <Button
              onClick={() => fileRef.current?.click()}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Share a story
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {groups.map((group) => (
              <StoryCard
                key={group.userId}
                group={group}
                isOwn={group.userId === user?.userId}
                onClick={() => {
                  setSelectedGroup(group);
                  setSelectedStoryIdx(0);
                }}
                onDelete={handleDeleteStory}
              />
            ))}
          </div>
        )}
      </div>

      {/* Story detail panel */}
      {selectedGroup && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setSelectedGroup(null)}
        >
          <div
            className="relative w-full max-w-[380px] h-[85vh] rounded-3xl overflow-hidden bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Story display */}
            <img
              src={buildMediaUrl(
                selectedGroup.stories[selectedStoryIdx]?.mediaUrl,
              )}
              alt="story"
              className="w-full h-full object-cover"
            />
            {/* Overlay header */}
            <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Avatar
                  src={selectedGroup.author?.profilePicUrl}
                  name={selectedGroup.author?.username}
                  size="sm"
                  ring
                />
                <span className="text-white text-sm font-semibold">
                  @{selectedGroup.author?.username}
                </span>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                ✕
              </button>
            </div>
            {/* Caption */}
            {selectedGroup.stories[selectedStoryIdx]?.caption && (
              <div className="absolute bottom-4 left-0 right-0 px-5">
                <p className="text-white text-sm bg-black/40 rounded-xl px-3 py-2 backdrop-blur-sm">
                  {selectedGroup.stories[selectedStoryIdx].caption}
                </p>
              </div>
            )}
            {/* Delete button for own stories */}
            {user?.userId === selectedGroup.userId && (
              <button
                onClick={() =>
                  handleDeleteStory(
                    selectedGroup.stories[selectedStoryIdx].storyId,
                  )
                }
                className="absolute top-16 right-4 text-xs text-rose-400 bg-black/40 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all"
              >
                Delete
              </button>
            )}
            {/* Story nav dots */}
            {selectedGroup.stories.length > 1 && (
              <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5">
                {selectedGroup.stories.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedStoryIdx(i)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i === selectedStoryIdx ? "bg-white w-4" : "bg-white/40",
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function StoryCard({
  group,
  isOwn,
  onClick,
  onDelete,
}: {
  group: StoryGroup;
  isOwn: boolean;
  onClick: () => void;
  onDelete: (id: number) => void;
}) {
  const latest = group.stories[0];
  return (
    <div
      className="relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      <img
        src={buildMediaUrl(latest.mediaUrl)}
        alt="story"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />
      {/* Story ring indicator */}
      <div
        className={cn(
          "absolute top-3 left-3 rounded-full p-[2.5px]",
          isOwn
            ? "bg-gradient-to-br from-brand-400 to-violet-500"
            : "bg-gradient-to-br from-brand-500 to-rose-400",
        )}
      >
        <div className="bg-black rounded-full p-[2px]">
          <Avatar
            src={group.author?.profilePicUrl}
            name={group.author?.username}
            size="xs"
          />
        </div>
      </div>
      {/* Story count badge */}
      {group.stories.length > 1 && (
        <span className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {group.stories.length}
        </span>
      )}
      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-xs font-semibold truncate">
          @{group.author?.username}
        </p>
        <p className="text-white/60 text-[10px] mt-0.5">
          {timeAgo(latest.createdAt)}
        </p>
      </div>
    </div>
  );
}
