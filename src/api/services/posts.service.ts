import { apiClient } from '../client';
import type {
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  FeedRequest,
  ChangeVisibilityRequest,
} from '../../types';

export const postsApi = {
  // POST /api/posts  → Post
  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const res = await apiClient.post<Post>('/posts', data);
    return res.data;
  },

  // GET /api/posts/{postId}  → Post
  getPost: async (postId: number): Promise<Post> => {
    const res = await apiClient.get<Post>(`/posts/${postId}`);
    return res.data;
  },

  // GET /api/posts/user/{userId}  → List<Post>
  getPostsByUser: async (userId: number): Promise<Post[]> => {
    const res = await apiClient.get<Post[]>(`/posts/user/${userId}`);
    return res.data;
  },

  // POST /api/posts/feed  → List<Post>  (body: FeedRequest { followeeIds: number[] })
  getFeed: async (data: FeedRequest): Promise<Post[]> => {
    const res = await apiClient.post<Post[]>('/posts/feed', data);
    return res.data;
  },

  // GET /api/posts/search?q=  → List<Post>
  searchPosts: async (q: string): Promise<Post[]> => {
    const res = await apiClient.get<Post[]>('/posts/search', { params: { q } });
    return res.data;
  },

  // GET /api/posts/user/{userId}/count  → { postCount: number }
  getPostCount: async (userId: number): Promise<{ postCount: number }> => {
    const res = await apiClient.get<{ postCount: number }>(`/posts/user/${userId}/count`);
    return res.data;
  },

  // PUT /api/posts/{postId}  → Post
  updatePost: async (postId: number, data: UpdatePostRequest): Promise<Post> => {
    const res = await apiClient.put<Post>(`/posts/${postId}`, data);
    return res.data;
  },

  // DELETE /api/posts/{postId}  → void
  deletePost: async (postId: number): Promise<void> => {
    await apiClient.delete(`/posts/${postId}`);
  },

  // PUT /api/posts/{postId}/visibility  → Post
  changeVisibility: async (postId: number, data: ChangeVisibilityRequest): Promise<Post> => {
    const res = await apiClient.put<Post>(`/posts/${postId}/visibility`, data);
    return res.data;
  },
};
