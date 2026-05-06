// ─── Auth Service DTOs ────────────────────────────────────────────────────────

export interface RegisterRequest {
  username: string;       // @Size(min=3, max=50)
  email: string;          // @Email
  password: string;       // @Size(min=3, max=50)
  fullName?: string;
}

export interface LoginRequest {
  email: string;          // @Email @NotBlank
  password: string;       // @NotBlank
}

export interface UpdateProfileRequest {
  username?: string;      // @Size(min=3, max=50)
  fullName?: string;      // @Size(max=100)
  bio?: string;           // @Size(max=500)
  profilePicUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string; // @NotBlank
  newPassword: string;     // @Size(min=8, max=72)
}

// Matches AuthResponse from AuthServiceImpl.login()
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserSummary;
}

// Matches UserSummary DTO exactly
export interface UserSummary {
  userId: number;
  username: string;
  email: string;
  fullName: string | null;
  bio: string | null;
  profilePicUrl: string | null;
  role: string;
  isActive: boolean;
}

// Matches User entity (returned by GET /api/auth/profile/{id})
export interface User {
  userId: number;
  username: string;
  email: string;
  fullName: string | null;
  bio: string | null;
  profilePicUrl: string | null;
  role: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Post Service DTOs ────────────────────────────────────────────────────────

export type PostType = 'TEXT' | 'MEDIA' | 'REEL' | 'STORY';
export type Visibility = 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';

export interface CreatePostRequest {
  authorId: number;
  content: string;        // @Size(min=1, max=5000)
  mediaUrls?: string[];
  postType?: PostType;
  visibility?: Visibility;
}

export interface UpdatePostRequest {
  content?: string;       // @Size(min=1, max=5000)
  mediaUrls?: string[];
}

export interface FeedRequest {
  followeeIds: number[];
}

export interface ChangeVisibilityRequest {
  visibility: Visibility; // must be PUBLIC|FOLLOWERS|PRIVATE
}

// Matches Post entity
export interface Post {
  postId: number;
  authorId: number;
  content: string;
  mediaUrls: string[];
  postType: PostType;
  visibility: Visibility;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Comment Service DTOs ─────────────────────────────────────────────────────

export interface CreateCommentRequest {
  authorId: number;
  postId: number;
  content: string;        // @Size(min=1, max=2000)
}

export interface UpdateCommentRequest {
  content: string;        // @Size(min=1, max=2000)
}

// Matches Comment entity
export interface Comment {
  commentId: number;
  postId: number;
  authorId: number;
  parentCommentId: number | null;
  content: string;
  likesCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Like Service DTOs ────────────────────────────────────────────────────────

export type TargetType = 'POST' | 'COMMENT';
export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

// Matches Like entity
export interface Like {
  likeId: number;
  userId: number;
  targetId: number;
  targetType: TargetType;
  reactionType: ReactionType;
  createdAt: string;
}

// Matches ReactionCountResponse DTO
export interface ReactionCountResponse {
  reactionType: string;
  count: number;
}

// Matches ReactionSummaryResponse DTO
export interface ReactionSummaryResponse {
  targetId: number;
  targetType: TargetType;
  reactions: Record<ReactionType, number>;
}

// ─── Follow Service DTOs ──────────────────────────────────────────────────────

export type FollowStatus = 'ACTIVE' | 'PENDING' | 'BLOCKED';

// Matches Follow entity
export interface Follow {
  followId: number;
  followerId: number;
  followeeId: number;
  status: FollowStatus;
  createdAt: string;
}

// ─── Media Service DTOs ───────────────────────────────────────────────────────

export type MediaType = 'IMAGE' | 'VIDEO';

// Matches Media entity
export interface Media {
  mediaId: number;
  uploaderId: number;
  url: string;
  mediaType: MediaType;
  sizeKb: number;
  mimeType: string | null;
  linkedPostId: number;
  filePath: string | null;
  originalFileName: string | null;
  deleteStatus: boolean;
  uploadedAt: string;
}

// Matches Story entity (note: authorId not userId)
export interface Story {
  storyId: number;
  authorId: number;
  mediaUrl: string;
  caption: string | null;
  mediaType: MediaType;
  viewCount: number;
  expiresAt: string;
  createdAt: string;
  activeStatus: boolean;
}

// ─── Search Service DTOs ──────────────────────────────────────────────────────

// Matches Hashtag entity
export interface Hashtag {
  hashtagId: number;
  tag: string;
  postCount: number;
  lastUsedAt: string | null;
}

// ─── UI-only helpers ──────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
}
