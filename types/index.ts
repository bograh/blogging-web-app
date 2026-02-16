// User types
export interface User {
  username: string;
  id: string;
  email: string;
  name: string;
  roles: string[];
  accessToken?: string;
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
  username: string;
}

// Post types
export interface Post {
  id: number;
  title: string;
  body?: string;
  authorId?: string;
  authorName?: string; // For list/detail endpoints
  author?: string | { username: string }; // For profile endpoint or GraphQL
  tags?: string[] | { name: string }[]; // Support both formats
  createdAt?: string; // For list/detail endpoints
  postedAt?: string; // For profile endpoint
  updatedAt?: string; // For GraphQL
  lastUpdated?: string;
  commentsCount?: number; // For list/detail endpoints
  totalComments?: number; // For profile endpoint
}

export interface CreatePostRequest {
  title: string;
  body: string;
  tags?: string[];
}

export interface UpdatePostRequest {
  title?: string;
  body?: string;
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
  totalPages?: number;
  first?: boolean;
  last: boolean;
}

// Metrics types
export interface MethodMetric {
  methodName: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalExecutionTime?: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  averageExecutionTime: number;
  successRate?: number;
}

// Metrics map: key is method name, value is metric data
export type MetricsMap = Record<string, MethodMetric>;

export interface MetricsResponse {
  metrics: MetricsMap | MethodMetric[];
  totalMethods: number;
  timestamp: string;
}

export interface MetricsSummary {
  totalFailures?: number;
  totalMethodsMonitored: number;
  totalExecutions: number;
  overallAverageExecutionTime: string | number;
  overallSuccessRate?: number;
  timestamp?: string;
}

// Cache Metrics types
export interface CacheMetric {
  cacheName: string;
  hits: number;
  misses: number;
  hitRate: string | number;
  missRate: string | number;
  totalRequests: number;
  puts: number;
  evictions: number;
  clears: number;
  timestamp?: string;
}

export interface CacheMetricsResponse {
  caches: Record<string, CacheMetric> | CacheMetric[];
  totalCaches: number;
  timestamp: string;
}

export interface BestWorstCache {
  name: string;
  hitRate: string | number;
}

export interface CacheSummary {
  totalCaches: number;
  totalHits: number;
  totalMisses: number;
  totalRequests: number;
  overallHitRate: string | number;
  totalPuts: number;
  totalEvictions: number;
  bestPerformingCache?: BestWorstCache;
  worstPerformingCache?: BestWorstCache;
  timestamp: string;
}

// Performance History types
export interface PerformanceSnapshot {
  id: string;
  timestamp: string;
  snapshotType: 'MANUAL' | 'SCHEDULED' | 'PRE_CACHE' | 'POST_CACHE';
  totalMethodsMonitored: number;
  totalExecutions: number;
  totalFailures: number;
  overallAverageExecutionTime: number;
  overallSuccessRate: number;
  methodMetrics: MethodMetric[];
}

export interface CacheSnapshot {
  id: string;
  timestamp: string;
  snapshotType: 'MANUAL' | 'SCHEDULED' | 'PRE_CACHE' | 'POST_CACHE';
  totalCaches: number;
  totalHits: number;
  totalMisses: number;
  totalRequests: number;
  overallHitRate: number;
  totalPuts: number;
  totalEvictions: number;
  bestPerformingCacheName: string;
  bestPerformingCacheHitRate: number;
  worstPerformingCacheName: string;
  worstPerformingCacheHitRate: number;
  cacheMetrics: CacheMetric[];
}

// Comparison types
export interface PreCacheMetric {
  totalCalls: number;
  avgExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
}

export interface PostCacheMetric {
  totalCalls: number;
  avgExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
}

export interface MetricImprovement {
  avgTimeReduction: number;
  avgTimeReductionPercent: string;
  minTimeReduction: number;
  maxTimeReduction: number;
  improved: boolean;
}

export interface MethodComparison {
  methodName: string;
  preCache: PreCacheMetric;
  postCache: PostCacheMetric;
  improvement: MetricImprovement;
}

export interface ComparisonSummary {
  methodsCompared: number;
  methodsImproved: number;
  methodsDegraded: number;
  methodsUnchanged: number;
  overallAvgImprovementPercent: string;
  bestImprovedMethod?: string;
  bestImprovementPercent?: string;
  worstMethod?: string;
  worstChangePercent?: string;
}

export interface PerformanceComparison {
  preCacheFile: string;
  postCacheTimestamp: string;
  methodComparisons: MethodComparison[];
  summary: ComparisonSummary;
  timestamp: string;
}

// Security Audit types
export type SecurityEventType =
  | 'SIGN_IN_SUCCESS'
  | 'SIGN_IN_FAILURE'
  | 'REGISTRATION_SUCCESS'
  | 'REGISTRATION_FAILURE'
  | 'TOKEN_VALIDATION_FAILURE'
  | 'ACCESS_DENIED'
  | 'RESTRICTED_ENDPOINT_ACCESS'
  | 'BRUTE_FORCE_SUSPECTED'
  | 'TOKEN_REFRESH'
  | 'SIGN_OUT';

export interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  username?: string;
  email?: string;
  ipAddress: string;
  userAgent: string;
  endpoint?: string;
  method?: string;
  details: string;
  success: boolean;
  timestamp: string;
}

export interface SecurityStats {
  sign_in_success_24h: number;
  sign_in_failure_24h: number;
  token_validation_failure_24h: number;
  access_denied_24h: number;
  restricted_endpoint_access_24h: number;
  brute_force_suspected_24h: number;
  recentBruteForceAttempts: number;
  trackedFailedIps: number;
  trackedFailedEmails: number;
}

export interface BlockedStatus {
  ipAddress: string;
  blocked: boolean;
}

// Admin types
export interface SessionStats {
  activeSessions: number;
  revokedTokens: number;
}

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  sessionStats?: SessionStats;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface AdminUserSummary {
  userId: string;
  username: string;
  email: string;
  totalPosts: number;
  totalComments: number;
  roles: string[];
  createdAt: string;
}

export interface AdminComment {
  id: string;
  content: string;
  postId: number;
  author: string;
  createdAt: string;
}

// Auth response structure from backend
export interface AuthResponseUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  user: AuthResponseUser;
  accessToken: string;
}

// Cache Simulation types
export interface SimulationPreCache {
  description: string;
  timesMs: number[];
  avgMs: number;
  minMs: number;
  maxMs: number;
}

export interface SimulationPostCache {
  description: string;
  cacheMissTimeMs: number;
  cacheHitTimesMs: number[];
  cacheHitAvgMs: number;
  cacheHitMinMs: number;
  cacheHitMaxMs: number;
}

export interface SimulationImprovement {
  avgTimeReductionMs: number;
  avgTimeReductionPercent: string;
  speedupFactor: string;
}

// Cached method result structure
export interface CachedSimulationMethodResult {
  method: string;
  cached: true;
  preCache: SimulationPreCache;
  postCache: SimulationPostCache;
  improvement: SimulationImprovement;
}

// Uncached method result structure (different API shape)
export interface UncachedSimulationMethodResult {
  method: string;
  cached: false;
  note: string;
  preCacheTimesMs: number[];
  preCacheAvgMs: number;
  preCacheMinMs: number;
  preCacheMaxMs: number;
}

// Discriminated union for method results
export type SimulationMethodResult = CachedSimulationMethodResult | UncachedSimulationMethodResult;

export interface SimulationSummary {
  totalMethodsSimulated: number;
  cachedMethods: number;
  uncachedMethods: number;
  overallAvgPreCacheMs: string;
  overallAvgPostCacheMs: string;
  overallImprovementPercent: string;
  recommendation: string;
}

export interface SimulationResult {
  simulationStartTime: string;
  iterations: number;
  methodResults: SimulationMethodResult[];
  summary: SimulationSummary;
  simulationEndTime: string;
}

export type SimulationMethodType =
  | 'getAllPosts'
  | 'getPostById'
  | 'getCommentsByPostId'
  | 'getPopularTags'
  | 'getAllComments';

