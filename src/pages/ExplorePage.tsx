import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Hash, Users, FileText, TrendingUp, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WideLayout } from '../components/layout/AppLayout';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { PostCard } from '../components/posts/PostCard';
import { PostSkeleton, UserCardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { searchApi, followsApi } from '../api';
import type { Post, User, Hashtag } from '../types';
import { formatCount, cn } from '../utils';

type SearchTab = 'all' | 'posts' | 'users' | 'hashtags';

interface SearchResults {
  posts: Post[];
  users: User[];
  hashtags: Hashtag[];
}

export default function ExplorePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [trending, setTrending] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [followedUsers, setFollowedUsers] = useState<Set<number>>(new Set());

  useEffect(() => {
    searchApi.getTrendingHashtags(10)
      .then(setTrending)
      .catch(() => {})
      .finally(() => setLoadingTrending(false));
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const data = await searchApi.searchAll(q.trim());
      setResults(data);
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  const handleFollow = async (targetId: number, username: string) => {
    if (!user) return;
    try {
      if (followedUsers.has(targetId)) {
        await followsApi.unfollow(targetId);
        setFollowedUsers(s => { const n = new Set(s); n.delete(targetId); return n; });
        toast.success(`Unfollowed @${username}`);
      } else {
        await followsApi.follow(targetId);
        setFollowedUsers(s => new Set([...s, targetId]));
        toast.success(`Following @${username}`);
      }
    } catch {
      toast.error('Action failed');
    }
  };

  const TABS: { key: SearchTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'all', label: 'All', icon: <Search className="w-3.5 h-3.5" /> },
    { key: 'posts', label: 'Posts', icon: <FileText className="w-3.5 h-3.5" />, count: results?.posts.length },
    { key: 'users', label: 'People', icon: <Users className="w-3.5 h-3.5" />, count: results?.users.length },
    { key: 'hashtags', label: 'Tags', icon: <Hash className="w-3.5 h-3.5" />, count: results?.hashtags.length },
  ];

  return (
    <WideLayout>
      <div className="space-y-6">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            placeholder="Search posts, people, hashtags…"
            className={cn(
              'w-full h-12 pl-11 pr-10 bg-card border rounded-2xl text-foreground',
              'placeholder:text-muted-foreground/60 text-sm transition-all duration-200 focus:outline-none',
              query ? 'border-brand-500/50 ring-2 ring-brand-500/15' : 'border-border hover:border-border/80'
            )}
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {results ? (
          <>
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-surface rounded-xl">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold flex-1 justify-center transition-all',
                    tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}>
                  {t.icon} {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={cn('ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                      tab === t.key ? 'bg-brand-500/20 text-brand-400' : 'bg-surface text-muted-foreground')}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-4">{[1,2,3].map(i => <PostSkeleton key={i} />)}</div>
            ) : (
              <div className="space-y-6">
                {/* People */}
                {(tab === 'all' || tab === 'users') && results.users.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> People
                    </h3>
                    <div className="bg-card border border-border rounded-2xl divide-y divide-border/50 overflow-hidden">
                      {results.users.map(u => (
                        <div key={u.userId} className="flex items-center gap-3 p-4 hover:bg-surface-hover transition-colors">
                          <Link to={`/profile/${u.userId}`} className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar src={u.profilePicUrl} name={u.fullName || u.username} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{u.fullName || u.username}</p>
                              <p className="text-xs text-muted-foreground">@{u.username}</p>
                              {u.bio && <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{u.bio}</p>}
                            </div>
                          </Link>
                          {user && u.userId !== user.userId && (
                            <Button variant={followedUsers.has(u.userId) ? 'secondary' : 'primary'} size="xs"
                              onClick={() => handleFollow(u.userId, u.username)}>
                              {followedUsers.has(u.userId) ? 'Unfollow' : 'Follow'}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Hashtags */}
                {(tab === 'all' || tab === 'hashtags') && results.hashtags.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5" /> Hashtags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {results.hashtags.map(h => (
                        <div key={h.hashtagId}
                          className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-xl hover:border-brand-500/40 hover:bg-brand-500/5 transition-all cursor-pointer">
                          <span className="text-brand-400 font-bold text-sm">#</span>
                          <span className="text-sm font-semibold text-foreground">{h.tag}</span>
                          <span className="text-xs text-muted-foreground ml-1">{formatCount(h.postCount)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Posts */}
                {(tab === 'all' || tab === 'posts') && results.posts.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> Posts
                    </h3>
                    <div className="space-y-4">
                      {results.posts.map(post => <PostCard key={post.postId} post={post} />)}
                    </div>
                  </section>
                )}

                {results.posts.length === 0 && results.users.length === 0 && results.hashtags.length === 0 && (
                  <div className="text-center py-16">
                    <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-1">No results for "{query}"</h3>
                    <p className="text-sm text-muted-foreground">Try different keywords or check your spelling.</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trending */}
            <div>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Trending Hashtags
              </h2>
              {loadingTrending ? (
                <div className="space-y-2">{[1,2,3,4,5].map(i => <UserCardSkeleton key={i} />)}</div>
              ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
                  {trending.map((h, i) => (
                    <button key={h.hashtagId}
                      onClick={() => { setQuery(h.tag); doSearch(h.tag); }}
                      className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-surface-hover transition-colors text-left">
                      <span className="text-xs font-bold text-muted-foreground w-5 text-center">#{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">#{h.tag}</p>
                        <p className="text-xs text-muted-foreground">{formatCount(h.postCount)} posts</p>
                      </div>
                      <TrendingUp className="w-3.5 h-3.5 text-brand-400/60" />
                    </button>
                  ))}
                  {trending.length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">No trending hashtags yet</div>
                  )}
                </div>
              )}
            </div>

            {/* Tips */}
            <div>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Search className="w-4 h-4" /> Search Tips
              </h2>
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                {[
                  { tip: 'Search by name or username', example: '"jane" or "janedoe"' },
                  { tip: 'Find posts by keyword', example: '"photography"' },
                  { tip: 'Discover hashtags', example: '"tech" or "design"' },
                ].map((t, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm text-foreground font-medium">{t.tip}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">e.g. {t.example}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </WideLayout>
  );
}
