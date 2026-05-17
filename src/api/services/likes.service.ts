import { apiClient } from '../client';
import type { Like, ReactionCountResponse, ReactionSummaryResponse, ReactionType, TargetType } from '../../types';

export const likesApi = {
  // POST /api/likes?targetId=&targetType=&reactionType=
  likeTarget: async (targetId: number, targetType: TargetType, reactionType: ReactionType = 'LIKE'): Promise<Like> => {
    const res = await apiClient.post<Like>('/likes', null, {
      params: { targetId, targetType, reactionType },
    });
    return res.data;
  },

  // DELETE /api/likes?targetId=&targetType=
  unlikeTarget: async (targetId: number, targetType: TargetType): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>('/likes', {
      params: { targetId, targetType },
    });
    return res.data;
  },

  // GET /api/likes/target/{targetType}/{targetId}
  getLikesByTarget: async (targetType: TargetType, targetId: number): Promise<Like[]> => {
    const res = await apiClient.get<Like[]>(`/likes/target/${targetType}/${targetId}`);
    return res.data;
  },

  // GET /api/likes/target/{targetType}/{targetId}/count  → { count: number }
  getLikeCount: async (targetType: TargetType, targetId: number): Promise<{ count: number }> => {
    const res = await apiClient.get<{ count: number }>(`/likes/target/${targetType}/${targetId}/count`);
    return res.data;
  },

  // GET /api/likes/target/{targetType}/{targetId}/count-by-type?reactionType=
  getLikeCountByType: async (targetType: TargetType, targetId: number, reactionType: ReactionType): Promise<ReactionCountResponse> => {
    const res = await apiClient.get<ReactionCountResponse>(
      `/likes/target/${targetType}/${targetId}/count-by-type`,
      { params: { reactionType } }
    );
    return res.data;
  },

  // GET /api/likes/target/{targetType}/{targetId}/summary  → ReactionSummaryResponse
  getReactionSummary: async (targetType: TargetType, targetId: number): Promise<ReactionSummaryResponse> => {
    const res = await apiClient.get<ReactionSummaryResponse>(`/likes/target/${targetType}/${targetId}/summary`);
    return res.data;
  },

  // GET /api/likes/target/{targetType}/{targetId}/me  → Like (404 if not liked)
  getUserReaction: async (targetType: TargetType, targetId: number): Promise<Like | null> => {
    try {
      const res = await apiClient.get<Like>(`/likes/target/${targetType}/${targetId}/me`);
      return res.data;
    } catch {
      return null;
    }
  },

  // GET /api/likes/target/{targetType}/{targetId}/has-liked  → { hasLiked: boolean }
  hasLiked: async (targetType: TargetType, targetId: number): Promise<boolean> => {
    const res = await apiClient.get<{ hasLiked: boolean }>(`/likes/target/${targetType}/${targetId}/has-liked`);
    return res.data.hasLiked;
  },

  // GET /api/likes/user/{userId}
  getLikesByUser: async (userId: number): Promise<Like[]> => {
    const res = await apiClient.get<Like[]>(`/likes/user/${userId}`);
    return res.data;
  },

  // PUT /api/likes?targetId=&targetType=&newReaction=
  changeReaction: async (targetId: number, targetType: TargetType, newReaction: ReactionType): Promise<Like> => {
    const res = await apiClient.put<Like>('/likes', null, {
      params: { targetId, targetType, newReaction },
    });
    return res.data;
  },
};
