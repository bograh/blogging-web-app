// User types
export interface User {
  username: any;
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  totalPosts: number;
  totalComments: number;
  recentPosts?: ProfilePost[];
  recentComments?: ProfileComment[];
}

// Profile-specific post type (API returns different field names)
export interface ProfilePost {
  id: number;
  title: string;
  body: string;
  excerpt?: string;
  author: string;
  authorId: string;
  tags: string[];
  postedAt: string;
  lastUpdated: string;
  totalComments: number;
}

// Profile-specific comment type
export interface ProfileComment {
  id: string;
  postId: number;
  author: string;
  content: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// Post types
export interface Post {
  id: number;
  title: string;
  body: string;
  excerpt?: string;
  authorId: string;
  authorName?: string; // For list/detail endpoints
  author?: string; // For profile endpoint
  tags: string[];
  createdAt?: string; // For list/detail endpoints
  postedAt?: string; // For profile endpoint
  lastUpdated: string;
  commentsCount?: number; // For list/detail endpoints
  totalComments?: number; // For profile endpoint
}

export interface CreatePostRequest {
  title: string;
  body: string;
  excerpt?: string;
  authorId: string;
  tags: string[];
}

export interface UpdatePostRequest {
  title?: string;
  body?: string;
  excerpt?: string;
  authorId: string;
  tags?: string[];
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  postId: number;
  authorId?: string;
  authorName?: string; // For list/detail endpoints
  author?: string; // For profile endpoint
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCommentRequest {
  commentContent: string;
  postId: number;
  authorId: string;
}

// Tag types
export interface Tag {
  name: string;
}

// API Response types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

export interface ApiError {
  errorStatus: string;
  errorMessage: string;
  errorCode: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// Metrics types
export interface MethodMetric {
  methodName: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  averageExecutionTime: number;
}

// Metrics map: key is method name, value is metric data
export type MetricsMap = Record<string, MethodMetric>;

export interface MetricsResponse {
  metrics: MetricsMap;
  totalMethods: number;
  timestamp: string;
}

export interface MetricsSummary {
  totalFailures: number;
  overallAverageExecutionTime: string;
  totalExecutions: number;
  totalMethodsMonitored: number;
}
