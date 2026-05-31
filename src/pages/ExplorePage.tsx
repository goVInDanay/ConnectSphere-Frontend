import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Hash,
  Users,
  FileText,
  TrendingUp,
  X,
  UserPlus,
  UserCheck,
  Compass,
} from "lucide-react";
import { Link } from "react-router-dom";
import { WideLayout } from "../components/layout/AppLayout";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { PostCard } from "../components/posts/PostCard";
import { PostSkeleton } from "../components/ui/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { searchApi, followsApi, authApi } from "../api";
import type { Post, User, Hashtag } from "../types";
import { formatCount, cn } from "../utils";

type SearchTab = "all" | "posts" | "users" | "hashtags";

interface SearchResults {
  posts: Post[];
  users: User[];
  hashtags: Hashtag[];
}

// Suggested User Card
function SuggestedUserCard({
  user,
  isFollowing,
  onFollow,
}: {
  user: User;
  isFollowing: boolean;
  onFollow: (u: User) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-hover/50 hover:bg-surface-hover border border-border/40 hover:border-border transition-all group">
      <Link to={`/profile/${user.userId}`} className="shrink-0">
        <Avatar
          src={user.profilePicUrl}
          name={user.fullName || user.username}
          size="md"
          ring
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${user.userId}`} className="block">
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-brand-400 transition-colors">
            {user.fullName || user.username}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            @{user.username}
          </p>
        </Link>
        {user.bio && (
          <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
            {user.bio}
          </p>
        )}
      </div>
      <button
        onClick={() => onFollow(user)}
        className={cn(
          "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
          isFollowing
            ? "bg-surface-hover text-muted-foreground border border-border hover:border-destructive/30 hover:text-destructive"
            : "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
        )}
      >
        {isFollowing ? (
          <>
            <UserCheck className="w-3.5 h-3.5" /> Following
          </>
        ) : (
          <>
            <UserPlus className="w-3.5 h-3.5" /> Follow
          </>
        )}
      </button>
    </div>
  );
}

// Hashtag
function HashtagPill({
  tag,
  count,
  onClick,
}: {
  tag: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full p-3 rounded-xl bg-surface-hover/40 hover:bg-surface-hover border border-border/40 hover:border-brand-500/30 transition-all group"
    >
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center text-sm font-bold">
          #
        </span>
        <div className="text-left">
          <p className="text-sm font-semibold text-foreground group-hover:text-brand-400 transition-colors">
            #{tag}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCount(count)} posts
          </p>
        </div>
      </div>
      <TrendingUp className="w-4 h-4 text-muted-foreground/40 group-hover:text-brand-400/60 transition-colors" />
    </button>
  );
}

// ExplorePage
export default function ExplorePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("all");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [trending, setTrending] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [followedUsers, setFollowedUsers] = useState<Set<number>>(new Set());

  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  useEffect(() => {
    if (!user) return;
    followsApi
      .getFolloweeIds()
      .then((ids) => setFollowedUsers(new Set(ids)))
      .catch(() => {
        followsApi
          .getFollowing(user.userId)
          .then((follows) =>
            setFollowedUsers(new Set(follows.map((f) => f.followeeId))),
          )
          .catch(() => {});
      });
  }, [user]);

  // Load trending hashtags on mount
  useEffect(() => {
    searchApi
      .getTrendingHashtags(10)
      .then(setTrending)
      .catch(() => {})
      .finally(() => setLoadingTrending(false));
  }, []);

  // Load suggested users when authenticated
  useEffect(() => {
    if (user) loadSuggestedUsers();
  }, [user]);

  const loadSuggestedUsers = async () => {
    setLoadingSuggested(true);
    try {
      const ids = await followsApi.getSuggestedUsers();
      const settled = await Promise.allSettled(
        ids.slice(0, 8).map((id) => authApi.getProfile(id)),
      );
      setSuggestedUsers(
        settled
          .filter(
            (r): r is PromiseFulfilledResult<User> => r.status === "fulfilled",
          )
          .map((r) => r.value),
      );
    } catch {
      setSuggestedUsers([]);
    } finally {
      setLoadingSuggested(false);
    }
  };

  // Search
  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults(null);
        return;
      }
      setLoading(true);
      try {
        const data = await searchApi.searchAll(q.trim());
        setResults(data);
      } catch {
        toast.error("Search failed");
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => doSearch(val), 400);
  };

  // Follow / Unfollow
  const handleFollow = async (target: User) => {
    if (!user) {
      toast.error("Sign in to follow users");
      return;
    }
    const id = target.userId;
    const nowFollowing = followedUsers.has(id);
    setFollowedUsers((prev) => {
      const next = new Set(prev);
      nowFollowing ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      if (nowFollowing) {
        await followsApi.unfollow(id);
        toast.success(`Unfollowed @${target.username}`);
      } else {
        await followsApi.follow(id);
        toast.success(`Following @${target.username}`);
      }
    } catch {
      setFollowedUsers((prev) => {
        const next = new Set(prev);
        nowFollowing ? next.add(id) : next.delete(id);
        return next;
      });
      toast.error("Action failed");
    }
  };

  // Derived display data
  const allPosts = results?.posts ?? [];
  const allUsers = results?.users ?? [];
  const allHashtags = results?.hashtags ?? [];

  const showPosts = tab === "all" || tab === "posts";
  const showUsers = tab === "all" || tab === "users";
  const showHashtags = tab === "all" || tab === "hashtags";
  const hasResults =
    results && allPosts.length + allUsers.length + allHashtags.length > 0;

  return (
    <WideLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInput}
            placeholder="Search posts, people, hashtags…"
            className={cn(
              "w-full pl-11 pr-10 py-3.5 rounded-2xl border text-sm transition-all",
              "bg-card text-foreground placeholder:text-muted-foreground",
              "border-border focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/10 outline-none",
            )}
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {query.trim() && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["all", "posts", "users", "hashtags"] as SearchTab[]).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all border",
                      tab === t
                        ? "bg-brand-500 text-white border-brand-500"
                        : "border-border text-muted-foreground hover:border-brand-500/30 hover:text-foreground",
                    )}
                  >
                    {t}
                    {t !== "all" && results && (
                      <span className="ml-1 opacity-60">
                        (
                        {t === "posts"
                          ? allPosts.length
                          : t === "users"
                            ? allUsers.length
                            : allHashtags.length}
                        )
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <PostSkeleton key={i} />
                ))}
              </div>
            ) : !hasResults ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No results for "{query}"
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {showUsers && allUsers.length > 0 && (
                  <section>
                    <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      <Users className="w-3.5 h-3.5" /> People
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allUsers.map((u) => (
                        <SuggestedUserCard
                          key={u.userId}
                          user={u}
                          isFollowing={followedUsers.has(u.userId)}
                          onFollow={handleFollow}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {showHashtags && allHashtags.length > 0 && (
                  <section>
                    <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      <Hash className="w-3.5 h-3.5" /> Hashtags
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allHashtags.map((h) => (
                        <HashtagPill
                          key={h.hashtagId ?? h.tag}
                          tag={h.tag}
                          count={h.postCount}
                          onClick={() => {
                            setQuery(`#${h.tag}`);
                            doSearch(h.tag);
                            setTab("posts");
                          }}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {showPosts && allPosts.length > 0 && (
                  <section>
                    <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      <FileText className="w-3.5 h-3.5" /> Posts
                    </h3>
                    <div className="space-y-4">
                      {allPosts.map((p) => (
                        <PostCard
                          key={p.postId}
                          post={p}
                          onDeleted={() => {}}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}
        {!query.trim() && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-foreground">
                  <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-brand-400" />
                  </div>
                  Suggested for you
                </h2>
                {user && (
                  <button
                    onClick={loadSuggestedUsers}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium"
                  >
                    Refresh
                  </button>
                )}
              </div>

              {!user ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <Compass className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in to discover people to follow
                  </p>
                  <Link to="/login">
                    <Button size="sm">Sign in</Button>
                  </Link>
                </div>
              ) : loadingSuggested ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 rounded-xl bg-surface-hover animate-pulse"
                    />
                  ))}
                </div>
              ) : suggestedUsers.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No suggestions right now
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {suggestedUsers.map((u) => (
                    <SuggestedUserCard
                      key={u.userId}
                      user={u}
                      isFollowing={followedUsers.has(u.userId)}
                      onFollow={handleFollow}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-5">
              <h2 className="flex items-center gap-2.5 text-base font-bold text-foreground">
                <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                </div>
                Trending
              </h2>

              {loadingTrending ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-14 rounded-xl bg-surface-hover animate-pulse"
                    />
                  ))}
                </div>
              ) : trending.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">
                  No trending topics
                </p>
              ) : (
                <div className="space-y-2">
                  {trending.map((h) => (
                    <HashtagPill
                      key={h.hashtagId ?? h.tag}
                      tag={h.tag}
                      count={h.postCount}
                      onClick={() => {
                        setQuery(`#${h.tag}`);
                        doSearch(h.tag);
                        setTab("posts");
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </WideLayout>
  );
}
