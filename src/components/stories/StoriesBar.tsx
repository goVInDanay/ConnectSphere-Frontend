import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { storiesApi, followsApi, authApi } from '../../api';
import type { Story, User } from '../../types';
import { timeAgo, cn, buildMediaUrl } from '../../utils';

interface StoryGroup {
  userId: number;
  author: User | null;
  stories: Story[];
}

// ── Story Viewer Modal ────────────────────────────────────────────────────────
interface ViewerProps {
  groups: StoryGroup[];
  initialGroupIdx: number;
  onClose: () => void;
  onDeleted: (storyId: number) => void;
}

function StoryViewer({ groups, initialGroupIdx, onClose, onDeleted }: ViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groupIdx, setGroupIdx] = useState(initialGroupIdx);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const DURATION = 5000;

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  useEffect(() => {
    if (!story) return;
    setProgress(0);
    storiesApi.viewStory(story.storyId).catch(() => {});
    const start = Date.now();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(timerRef.current); advance(); }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [story?.storyId]);

  const advance = () => {
    if (storyIdx < (group?.stories.length ?? 0) - 1) {
      setStoryIdx(i => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(i => i + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  };

  const goBack = () => {
    if (storyIdx > 0) setStoryIdx(i => i - 1);
    else if (groupIdx > 0) { setGroupIdx(i => i - 1); setStoryIdx(0); }
  };

  const handleDelete = async () => {
    if (!story) return;
    try {
      await storiesApi.deleteStory(story.storyId);
      onDeleted(story.storyId);
      toast.success('Story deleted');
      advance();
    } catch { toast.error('Failed to delete story'); }
  };

  if (!story || !group) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full max-w-[380px] h-[85vh] rounded-3xl overflow-hidden bg-black shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3 pt-4">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-none"
                style={{ width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%' }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4 pt-2">
          <div className="flex items-center gap-2.5">
            <Avatar src={group.author?.profilePicUrl} name={group.author?.username} size="sm" ring />
            <div>
              <p className="text-white text-sm font-semibold drop-shadow">@{group.author?.username}</p>
              <p className="text-white/60 text-xs">{timeAgo(story.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.userId === story.authorId && (
              <button onClick={handleDelete}
                className="p-2 rounded-full bg-white/10 hover:bg-rose-500/30 text-white/80 hover:text-rose-300 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Media */}
        <img src={buildMediaUrl(story.mediaUrl)} alt="story" className="w-full h-full object-cover" />

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-12 left-0 right-0 px-5 pb-2 pt-10 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm leading-relaxed">{story.caption}</p>
          </div>
        )}

        {/* Tap nav zones */}
        <button className="absolute left-0 top-16 bottom-0 w-1/3 z-10" onClick={e => { e.stopPropagation(); goBack(); }} />
        <button className="absolute right-0 top-16 bottom-0 w-1/3 z-10" onClick={e => { e.stopPropagation(); advance(); }} />

        {/* Arrow hints */}
        {groupIdx > 0 && (
          <button onClick={e => { e.stopPropagation(); setGroupIdx(i => i - 1); setStoryIdx(0); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {groupIdx < groups.length - 1 && (
          <button onClick={e => { e.stopPropagation(); setGroupIdx(i => i + 1); setStoryIdx(0); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Stories Bar ───────────────────────────────────────────────────────────────
export function StoriesBar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIdx, setViewerGroupIdx] = useState(0);

  useEffect(() => { loadStories(); }, [user]);

  const loadStories = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const followeeIds = await followsApi.getFolloweeIds();
      const authorIds = [...new Set([user.userId, ...followeeIds])];
      const stories = await storiesApi.getStoriesFeed(authorIds);

      // Group by author
      const map = new Map<number, Story[]>();
      stories.forEach(s => {
        if (!map.has(s.authorId)) map.set(s.authorId, []);
        map.get(s.authorId)!.push(s);
      });

      const grouped: StoryGroup[] = await Promise.all(
        Array.from(map.entries()).map(async ([uid, strs]) => {
          const author = await authApi.getProfile(uid).catch(() => null);
          return { userId: uid, author, stories: strs };
        })
      );
      // Own stories first
      grouped.sort((a, b) => (a.userId === user.userId ? -1 : b.userId === user.userId ? 1 : 0));
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
    e.target.value = '';
    setUploading(true);
    try {
      await storiesApi.createStory(file);
      toast.success('Story posted!');
      loadStories();
    } catch {
      toast.error('Failed to upload story');
    } finally {
      setUploading(false);
    }
  };

  const handleStoryDeleted = (storyId: number) => {
    setGroups(prev =>
      prev
        .map(g => ({ ...g, stories: g.stories.filter(s => s.storyId !== storyId) }))
        .filter(g => g.stories.length > 0)
    );
  };

  const ownGroup = groups.find(g => g.userId === user?.userId);

  if (!user) return null;

  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
          {/* Add / Own story */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            {ownGroup ? (
              <button
                onClick={() => { setViewerGroupIdx(groups.findIndex(g => g.userId === user.userId)); setViewerOpen(true); }}
                className="story-ring p-[2.5px] rounded-full hover:opacity-90 transition-opacity">
                <div className="bg-background p-[2px] rounded-full">
                  <Avatar src={user.profilePicUrl} name={user.fullName || user.username} size="md" />
                </div>
              </button>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={cn(
                  'relative w-12 h-12 rounded-full border-2 border-dashed border-brand-500/50',
                  'flex items-center justify-center bg-brand-500/5',
                  'hover:border-brand-500 hover:bg-brand-500/10 transition-all',
                  uploading && 'opacity-50 cursor-not-allowed'
                )}>
                {uploading
                  ? <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                  : <Plus className="w-5 h-5 text-brand-400" />
                }
              </button>
            )}
            <span className="text-[11px] text-muted-foreground font-medium">
              {ownGroup ? 'Your story' : uploading ? 'Uploading…' : 'Add story'}
            </span>
            <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
          </div>

          {/* Other users */}
          {groups.filter(g => g.userId !== user?.userId).map((group, i) => (
            <button key={group.userId}
              onClick={() => { setViewerGroupIdx(groups.indexOf(group)); setViewerOpen(true); }}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 hover:opacity-90 transition-opacity">
              <div className="story-ring p-[2.5px] rounded-full">
                <div className="bg-background p-[2px] rounded-full">
                  <Avatar src={group.author?.profilePicUrl} name={group.author?.fullName || group.author?.username} size="md" />
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium max-w-[52px] truncate">
                {group.author?.username || '…'}
              </span>
            </button>
          ))}

          {!loading && groups.length === 0 && (
            <p className="text-xs text-muted-foreground self-center py-1">
              No stories yet — be the first!
            </p>
          )}

          {loading && (
            <div className="flex gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-surface animate-pulse" />
                  <div className="w-10 h-2.5 rounded bg-surface animate-pulse" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewerOpen && groups.length > 0 && (
        <StoryViewer
          groups={groups}
          initialGroupIdx={viewerGroupIdx}
          onClose={() => setViewerOpen(false)}
          onDeleted={handleStoryDeleted}
        />
      )}
    </>
  );
}
