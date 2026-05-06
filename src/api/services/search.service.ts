import { apiClient } from '../client';
import type { Hashtag, Post, User } from '../../types';

export const searchApi = {
  // GET /api/search/posts?q=  → List<Object> (Post objects)
  searchPosts: async (q: string): Promise<Post[]> => {
    const res = await apiClient.get<Post[]>('/search/posts', { params: { q } });
    return res.data;
  },

  // GET /api/search/users?q=  → List<Object> (User objects)
  searchUsers: async (q: string): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/search/users', { params: { q } });
    return res.data;
  },

  // GET /api/search/all?q=  → { posts: [], users: [], hashtags: [] }
  searchAll: async (q: string): Promise<{ posts: Post[]; users: User[]; hashtags: Hashtag[] }> => {
    const res = await apiClient.get<{ posts: Post[]; users: User[]; hashtags: Hashtag[] }>(
      '/search/all',
      { params: { q } }
    );
    return res.data;
  },

  // GET /api/hashtags/trending?limit=  → List<Hashtag>
  getTrendingHashtags: async (limit = 20): Promise<Hashtag[]> => {
    const res = await apiClient.get<Hashtag[]>('/hashtags/trending', { params: { limit } });
    return res.data;
  },

  // GET /api/hashtags/{tag}/posts  → { tag, postIds, count }
  getPostsByHashtag: async (tag: string): Promise<{ tag: string; postIds: number[]; count: number }> => {
    const res = await apiClient.get<{ tag: string; postIds: number[]; count: number }>(
      `/hashtags/${tag}/posts`
    );
    return res.data;
  },

  // GET /api/hashtags/{tag}/count  → { tag, postCount }
  getHashtagCount: async (tag: string): Promise<{ tag: string; postCount: number }> => {
    const res = await apiClient.get<{ tag: string; postCount: number }>(`/hashtags/${tag}/count`);
    return res.data;
  },

  // GET /api/hashtags/post/{postId}  → List<Hashtag>
  getHashtagsForPost: async (postId: number): Promise<Hashtag[]> => {
    const res = await apiClient.get<Hashtag[]>(`/hashtags/post/${postId}`);
    return res.data;
  },

  // GET /api/hashtags/search?q=  → List<Hashtag>
  searchHashtags: async (q: string): Promise<Hashtag[]> => {
    const res = await apiClient.get<Hashtag[]>('/hashtags/search', { params: { q } });
    return res.data;
  },
};
