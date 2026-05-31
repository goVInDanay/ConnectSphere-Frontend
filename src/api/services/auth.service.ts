import { apiClient } from '../client';
import type {
  RegisterRequest,
  LoginRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  AuthResponse,
  User,
} from '../../types';

// Gateway routes: /api/auth/** → http://auth-service:8081/api/auth/**

export const authApi = {
  // POST /api/auth/register  → returns User entity
  register: async (data: RegisterRequest): Promise<User> => {
    const res = await apiClient.post<User>('/auth/register', data);
    return res.data;
  },

  // POST /api/auth/login  → returns AuthResponse (accessToken, refreshToken, UserSummary)
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  // POST /api/auth/logout  → void (revokes token via denylist)
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  // POST /api/auth/refresh  → { accessToken }
  refresh: async (): Promise<{ accessToken: string }> => {
    const res = await apiClient.post<{ accessToken: string }>('/auth/refresh');
    return res.data;
  },

  // GET /api/auth/profile/{userId}  → User entity
  getProfile: async (userId: number): Promise<User> => {
    const res = await apiClient.get<User>(`/auth/profile/${userId}`);
    return res.data;
  },

  // PUT /api/auth/profile  → User entity
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const res = await apiClient.put<User>('/auth/profile', data);
    return res.data;
  },

  // PUT /api/auth/password  → void
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.put('/auth/password', data);
  },

  // GET /api/auth/search?q=  → List<User>
  searchUsers: async (q: string): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/auth/search', { params: { q } });
    return res.data;
  },

  // DELETE /api/auth/deactivate  → void
  deactivateAccount: async (): Promise<void> => {
    await apiClient.delete('/auth/deactivate');
  },
};
