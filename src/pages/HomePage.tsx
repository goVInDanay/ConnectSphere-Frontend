import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { CreatePost } from '../components/posts/CreatePost';
import { PostCard } from '../components/posts/PostCard';
import { StoriesBar } from '../components/stories/StoriesBar';
import { PostSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { postsApi, followsApi } from '../api';
import type { Post } from '../types';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const followeeIds = await followsApi.getFolloweeIds();
        const feed = await postsApi.getFeed({ followeeIds: [user.userId, ...followeeIds] });
        setPosts(feed);
      } else {
        const pub = await postsApi.searchPosts('');
        setPosts(pub);
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-brand-400" />
          <h1 className="text-xl font-bold text-foreground">Your Feed</h1>
        </div>

        {isAuthenticated && <StoriesBar />}
        {isAuthenticated && <CreatePost onCreated={(post) => setPosts((p) => [post, ...p])} />}

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <PostSkeleton key={i} />)}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4 animate-float">
              <Sparkles className="w-9 h-9 text-brand-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {isAuthenticated ? 'Your feed is quiet' : 'Welcome to ConnectSphere'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {isAuthenticated
                ? 'Follow people to see their posts here, or create your first post above.'
                : 'Sign in to see your personalized feed.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.postId}
                post={post}
                onDeleted={(id) => setPosts((p) => p.filter(x => x.postId !== id))}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
