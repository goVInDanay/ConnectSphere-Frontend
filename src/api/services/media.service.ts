import { apiClient } from '../client';
import type { Media, Story } from '../../types';

export const mediaApi = {
  // POST /api/media/upload  multipart/form-data  → Media
  uploadMedia: async (file: File, linkedPostId = 0): Promise<Media> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<Media>('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { linkedPostId },
    });
    return res.data;
  },

  // GET /api/post/{postId}  → List<Media>
  getMediaByPost: async (postId: number): Promise<Media[]> => {
    const res = await apiClient.get<Media[]>(`/post/${postId}`);
    return res.data;
  },

  // GET /api/media/{mediaId}  → Media
  getMediaById: async (mediaId: number): Promise<Media> => {
    const res = await apiClient.get<Media>(`/media/${mediaId}`);
    return res.data;
  },

  // DELETE /api/media/{mediaId}
  deleteMedia: async (mediaId: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/media/${mediaId}`);
    return res.data;
  },

  // DELETE /api/media/post/{postId}
  deleteMediaByPost: async (postId: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/media/post/${postId}`);
    return res.data;
  },
};

export const storiesApi = {
  // POST /api/stories/upload  multipart/form-data  → Story
  createStory: async (file: File, caption = ''): Promise<Story> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<Story>('/stories/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { caption },
    });
    return res.data;
  },

  // GET /api/stories/feed?authorIds=1,2,3  → List<Story>
  getStoriesFeed: async (authorIds: number[]): Promise<Story[]> => {
    const res = await apiClient.get<Story[]>('/stories/feed', {
      params: { authorIds },
      // Spring expects repeated params: authorIds=1&authorIds=2
      paramsSerializer: (params) => {
        return params.authorIds.map((id: number) => `authorIds=${id}`).join('&');
      },
    });
    return res.data;
  },

  // GET /api/stories/{storyId}  → Story (also increments viewCount)
  viewStory: async (storyId: number): Promise<Story> => {
    const res = await apiClient.get<Story>(`/stories/${storyId}`);
    return res.data;
  },

  // GET /api/stories/user/{userId}  → List<Story>
  getStoriesByUser: async (userId: number): Promise<Story[]> => {
    const res = await apiClient.get<Story[]>(`/stories/user/${userId}`);
    return res.data;
  },

  // DELETE /api/stories/{storyId}
  deleteStory: async (storyId: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/stories/${storyId}`);
    return res.data;
  },
};
