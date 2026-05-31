// Auth Service DTOs

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  username?: string;
  fullName?: string;
  bio?: string;
  profilePicUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserSummary;
}

export interface UserSummary {
  userId: number;
  username: string;
  email: string;
  fullName: string | null;
  bio: string | null;
  profilePicUrl: string | null;
  role: string;
  active: boolean;
}

export interface User {
  userId: number;
  username: string;
  email: string;
  fullName: string | null;
  bio: string | null;
  profilePicUrl: string | null;
  role: string;
  provider: string;
  active: boolean;
  flagged?: boolean;
  suspended?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Post Service DTOs

export type PostType = "TEXT" | "MEDIA" | "REEL" | "STORY";
export type Visibility = "PUBLIC" | "FOLLOWERS" | "PRIVATE";

export interface CreatePostRequest {
  authorId: number;
  content: string;
  mediaUrls?: string[];
  postType?: PostType;
  visibility?: Visibility;
}

export interface UpdatePostRequest {
  content?: string;
  mediaUrls?: string[];
}

export interface FeedRequest {
  followeeIds: number[];
}

export interface ChangeVisibilityRequest {
  visibility: Visibility;
}

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
  isFlagged?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Comment Service DTOs

export interface CreateCommentRequest {
  authorId: number;
  postId: number;
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface Comment {
  commentId: number;
  postId: number;
  authorId: number;
  parentCommentId: number | null;
  content: string;
  likesCount: number;
  isDeleted: boolean;
  isFlagged?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Like Service DTOs

export type TargetType = "POST" | "COMMENT";
export type ReactionType = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";

export interface Like {
  likeId: number;
  userId: number;
  targetId: number;
  targetType: TargetType;
  reactionType: ReactionType;
  createdAt: string;
}

export interface ReactionCountResponse {
  reactionType: string;
  count: number;
}

export interface ReactionSummaryResponse {
  targetId: number;
  targetType: TargetType;
  reactions: Record<ReactionType, number>;
}

// Follow Service DTOs

export type FollowStatus = "ACTIVE" | "PENDING" | "BLOCKED";

export interface Follow {
  followId: number;
  followerId: number;
  followeeId: number;
  status: FollowStatus;
  createdAt: string;
}

// Media Service DTOs

export type MediaType = "IMAGE" | "VIDEO";

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

// Search Service DTOs

export interface Hashtag {
  hashtagId: number;
  tag: string;
  postCount: number;
  lastUsedAt: string | null;
}

// Notification Service DTOs

export type NotificationType =
  | "LIKE"
  | "COMMENT"
  | "REPLY"
  | "FOLLOW"
  | "MENTION"
  | "ACCOUNT_ACTION"
  | "BROADCAST";

export interface Notification {
  notificationId: number;
  recipientId: number;
  actorId: number;
  type: NotificationType;
  message: string | null;
  targetId: number;
  targetType: string | null; // 'POST' | 'COMMENT' | 'USER'
  deepLinkUrl: string | null;
  readStatus: boolean;
  createdAt: string;
}

// Admin DTOs

export type ReportStatus = "PENDING" | "RESOLVED" | "REJECTED";
export type ReportType = "POST" | "COMMENT" | "USER";

export interface Report {
  reportId?: number;
  id?: number;
  reporterId: number;
  targetId: number;
  reportType: ReportType;
  reason: string;
  status: ReportStatus;
  createdAt?: string;
}

// UI-only helpers

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
}
