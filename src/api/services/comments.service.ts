import { apiClient } from '../client';
import type { Comment, CreateCommentRequest, UpdateCommentRequest } from '../../types';

export const commentsApi = {
  // POST /api/comments  — authorId is set server-side via @AuthenticationPrincipal
  addComment: async (data: Omit<CreateCommentRequest, 'authorId'>): Promise<Comment> => {
    const res = await apiClient.post<Comment>('/comments', data);
    return res.data;
  },

  // POST /api/comments/{commentId}/replies
  addReply: async (commentId: number, data: Omit<CreateCommentRequest, 'authorId'>): Promise<Comment> => {
    const res = await apiClient.post<Comment>(`/comments/${commentId}/replies`, data);
    return res.data;
  },

  // GET /api/comments/post/{postId}
  getCommentsByPost: async (postId: number): Promise<Comment[]> => {
    const res = await apiClient.get<Comment[]>(`/comments/post/${postId}`);
    return res.data;
  },

  // GET /api/comments/{commentId}
  getCommentById: async (commentId: number): Promise<Comment> => {
    const res = await apiClient.get<Comment>(`/comments/${commentId}`);
    return res.data;
  },

  // GET /api/comments/{commentId}/replies
  getReplies: async (commentId: number): Promise<Comment[]> => {
    const res = await apiClient.get<Comment[]>(`/comments/${commentId}/replies`);
    return res.data;
  },

  // GET /api/comments/user/{userId}
  getCommentsByUser: async (userId: number): Promise<Comment[]> => {
    const res = await apiClient.get<Comment[]>(`/comments/user/${userId}`);
    return res.data;
  },

  // PUT /api/comments/{commentId}
  updateComment: async (commentId: number, data: UpdateCommentRequest): Promise<Comment> => {
    const res = await apiClient.put<Comment>(`/comments/${commentId}`, data);
    return res.data;
  },

  // DELETE /api/comments/{commentId}
  deleteComment: async (commentId: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/comments/${commentId}`);
    return res.data;
  },

  // POST /api/comments/{commentId}/like
  likeComment: async (commentId: number): Promise<void> => {
    await apiClient.post(`/comments/${commentId}/like`);
  },

  // POST /api/comments/{commentId}/unlike
  unlikeComment: async (commentId: number): Promise<void> => {
    await apiClient.post(`/comments/${commentId}/unlike`);
  },

  // GET /api/comments/post/{postId}/count
  getCommentCount: async (postId: number): Promise<{ commentCount: number }> => {
    const res = await apiClient.get<{ commentCount: number }>(`/comments/post/${postId}/count`);
    return res.data;
  },
};
