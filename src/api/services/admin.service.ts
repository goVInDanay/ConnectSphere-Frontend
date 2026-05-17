import { apiClient } from '../client';
import type { User, Post, Comment, Report } from '../../types';

// Admin endpoints via API Gateway (all require ADMIN role):
// /api/admin/users/**  → auth-service
// /api/admin/posts/**  → post-service
// /api/admin/comments/** → comment-service

export const adminApi = {
  // ─── User Management ────────────────────────────────────────────────────────

  // GET /api/admin/users/users → List<User>
  getAllUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/admin/users/users');
    return res.data;
  },

  // GET /api/admin/users/users/flagged → List<User>
  getFlaggedUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/admin/users/users/flagged');
    return res.data;
  },

  // PUT /api/admin/users/{userId}/suspend → ok
  suspendUser: async (userId: number): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/suspend`);
  },

  // PUT /api/admin/users/{userId}/activate → ok
  activateUser: async (userId: number): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/activate`);
  },

  // PUT /api/admin/users/{userId}/deactivate → ok
  deactivateUser: async (userId: number): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/deactivate`);
  },

  // DELETE /api/admin/users/{userId} → ok
  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  // POST /api/admin/users/users/{id}/flag → void
  flagUser: async (userId: number): Promise<void> => {
    await apiClient.post(`/admin/users/users/${userId}/flag`);
  },

  // POST /api/admin/users/users/{id}/unflag → void
  unflagUser: async (userId: number): Promise<void> => {
    await apiClient.post(`/admin/users/users/${userId}/unflag`);
  },

  // ─── User Reports ────────────────────────────────────────────────────────────

  // GET /api/admin/users/reports → List<Report>
  getUserReports: async (): Promise<Report[]> => {
    const res = await apiClient.get<Report[]>('/admin/users/reports');
    return res.data;
  },

  // PUT /api/admin/users/{id}/approve → ok
  approveUserReport: async (reportId: number): Promise<void> => {
    await apiClient.put(`/admin/users/${reportId}/approve`);
  },

  // PUT /api/admin/users/{id}/reject → ok
  rejectUserReport: async (reportId: number): Promise<void> => {
    await apiClient.put(`/admin/users/${reportId}/reject`);
  },

  // ─── Post Management ─────────────────────────────────────────────────────────

  // GET /api/admin/posts → List<Post>
  getAllPosts: async (): Promise<Post[]> => {
    const res = await apiClient.get<Post[]>('/admin/posts');
    return res.data;
  },

  // GET /api/admin/posts/flagged → List<Post>
  getFlaggedPosts: async (): Promise<Post[]> => {
    const res = await apiClient.get<Post[]>('/admin/posts/flagged');
    return res.data;
  },

  // DELETE /api/admin/posts/{postId} → ok
  deletePost: async (postId: number): Promise<void> => {
    await apiClient.delete(`/admin/posts/${postId}`);
  },

  // PUT /api/admin/posts/{postId}/approve → ok
  approvePost: async (postId: number): Promise<void> => {
    await apiClient.put(`/admin/posts/${postId}/approve`);
  },

  // PUT /api/admin/posts/{postId}/reject → ok
  rejectPost: async (postId: number): Promise<void> => {
    await apiClient.put(`/admin/posts/${postId}/reject`);
  },

  // GET /api/admin/posts/reports/{id} → Report
  getPostReport: async (reportId: number): Promise<Report> => {
    const res = await apiClient.get<Report>(`/admin/posts/reports/${reportId}`);
    return res.data;
  },

  // PUT /api/admin/posts/reports/{id}/resolve → ok
  resolvePostReport: async (reportId: number): Promise<void> => {
    await apiClient.put(`/admin/posts/reports/${reportId}/resolve`);
  },

  // PUT /api/admin/posts/reports/{id}/invalidate → ok
  invalidatePostReport: async (reportId: number): Promise<void> => {
    await apiClient.put(`/admin/posts/reports/${reportId}/invalidate`);
  },

  // ─── Comment Management ───────────────────────────────────────────────────────

  // GET /api/admin/comments → List<Comment>
  getAllComments: async (): Promise<Comment[]> => {
    const res = await apiClient.get<Comment[]>('/admin/comments');
    return res.data;
  },

  // GET /api/admin/comments/flagged → List<Comment>
  getFlaggedComments: async (): Promise<Comment[]> => {
    const res = await apiClient.get<Comment[]>('/admin/comments/flagged');
    return res.data;
  },

  // DELETE /api/admin/comments/{commentId} → ok
  deleteComment: async (commentId: number): Promise<void> => {
    await apiClient.delete(`/admin/comments/${commentId}`);
  },

  // PUT /api/admin/comments/{commentId}/approve → ok
  approveComment: async (commentId: number): Promise<void> => {
    await apiClient.put(`/admin/comments/${commentId}/approve`);
  },

  // PUT /api/admin/comments/{commentId}/reject → ok
  rejectComment: async (commentId: number): Promise<void> => {
    await apiClient.put(`/admin/comments/${commentId}/reject`);
  },

  // GET /api/admin/comments/reports → List<Report>
  getCommentReports: async (): Promise<Report[]> => {
    const res = await apiClient.get<Report[]>('/admin/comments/reports');
    return res.data;
  },

  // PUT /api/admin/comments/reports/{id}/approve → ok
  approveCommentReport: async (reportId: number): Promise<void> => {
    await apiClient.put(`/admin/comments/reports/${reportId}/approve`);
  },

  // PUT /api/admin/comments/reports/{id}/reject → ok
  rejectCommentReport: async (reportId: number): Promise<void> => {
    await apiClient.put(`/admin/comments/reports/${reportId}/reject`);
  },
};
