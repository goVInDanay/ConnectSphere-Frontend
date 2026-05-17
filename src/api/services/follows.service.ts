import { apiClient } from "../client";
import type { Follow } from "../../types";

// Note: backend entity is "Follows" but we alias as Follow in TS types
export const followsApi = {
  // POST /api/follows/{followeeId}
  follow: async (followeeId: number): Promise<Follow> => {
    const res = await apiClient.post<Follow>(`/follows/${followeeId}`);
    return res.data;
  },

  // DELETE /api/follows/{followeeId}
  unfollow: async (followeeId: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(
      `/follows/${followeeId}`,
    );
    return res.data;
  },

  // GET /api/follows/{userId}/followers  → List<Follows>
  getFollowers: async (userId: number): Promise<Follow[]> => {
    const res = await apiClient.get<Follow[]>(`/follows/${userId}/followers`);
    return res.data;
  },

  // GET /api/follows/{userId}/following  → List<Follows>
  getFollowing: async (userId: number): Promise<Follow[]> => {
    const res = await apiClient.get<Follow[]>(`/follows/${userId}/following`);
    return res.data;
  },

  // GET /api/follows/{userId}/follower-count  → { followerCount: number }
  getFollowerCount: async (
    userId: number,
  ): Promise<{ followerCount: number }> => {
    const res = await apiClient.get<{ followerCount: number }>(
      `/follows/${userId}/follower-count`,
    );
    return res.data;
  },

  // GET /api/follows/{userId}/following-count  → { followerCount: number } (reused key in backend)
  getFollowingCount: async (
    userId: number,
  ): Promise<{ followingCount: number }> => {
    const res = await apiClient.get<{ followingCount: number }>(
      `/follows/${userId}/following-count`,
    );
    return res.data;
  },

  // GET /api/follows/is-following/{followeeId}  → { isFollowing: boolean }
  isFollowing: async (followeeId: number): Promise<boolean> => {
    const res = await apiClient.get<{ isFollowing: boolean }>(
      `/follows/is-following/${followeeId}`,
    );
    return res.data.isFollowing;
  },

  // GET /api/follows/mutual  → { mutualFollowIds: number[] }
  getMutualFollows: async (): Promise<number[]> => {
    const res = await apiClient.get<{ mutualFollowIds: number[] }>(
      "/follows/mutual",
    );
    return res.data.mutualFollowIds;
  },

  // GET /api/follows/suggested  → { suggestedUserIds: number[] }
  getSuggestedUsers: async (): Promise<number[]> => {
    const res = await apiClient.get<{ suggestedUserIds: number[] }>(
      "/follows/suggested",
    );
    return res.data.suggestedUserIds;
  },

  // GET /api/follows/followee-ids  → { followeeIds: number[] }
  getFolloweeIds: async (): Promise<number[]> => {
    const res = await apiClient.get<{ followeeIds: number[] }>(
      "/follows/followee-ids",
    );
    return res.data.followeeIds;
  },
};
