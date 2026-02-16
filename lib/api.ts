import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import {
  User, LoginRequest, RegisterRequest, Post, CreatePostRequest, UpdatePostRequest,
  ApiResponse, PaginatedResponse, Comment, CreateCommentRequest,
  MetricsResponse, MetricsSummary, UserProfile, Tag, CacheMetricsResponse,
  CacheMetric, CacheSummary, AdminStats, AdminUser, AdminUserSummary, AdminComment, AuthResponse
} from '@/types';

// --- API CONFIGURATION ---
const BASE_URL = 'http://localhost:8080';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for refresh token
});

// --- TOKEN MANAGEMENT ---
const TOKEN_KEY = 'devblog_token';

export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp - 30000; // 30 second buffer
    } catch {
      return true;
    }
  }
};

// --- REFRESH TOKEN LOGIC ---
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await axios.post<{ status: string; message: string; data: AuthResponse }>(
      `${BASE_URL}/api/auth/refresh-token`,
      {},
      { withCredentials: true }
    );
    // The response structure is: { status, message, data: { user, accessToken } }
    const authData = response.data.data;
    const newToken = authData?.accessToken;
    if (newToken) {
      tokenManager.setToken(newToken);
      // Also update stored user data
      if (authData?.user) {
        const user: User = {
          id: authData.user.id,
          username: authData.user.username,
          email: authData.user.email,
          name: authData.user.username,
          roles: authData.user.roles || [],
          accessToken: newToken,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        storage.setUserId(user.id);
        storage.setUser(user);
      }
      return newToken;
    }
    return null;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    tokenManager.removeToken();
    return null;
  }
};

// Request interceptor to add auth header and check token expiration
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip auth for auth endpoints
    const isAuthEndpoint = config.url?.includes('/api/auth/');
    if (isAuthEndpoint) return config;

    let token = tokenManager.getToken();

    if (token && tokenManager.isTokenExpired(token)) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onTokenRefreshed(newToken);
          token = newToken;
        } else {
          // Token refresh failed, redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('Token refresh failed'));
        }
      } else {
        // Wait for existing refresh request
        token = await new Promise<string>(resolve => {
          subscribeTokenRefresh(resolve);
        });
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onTokenRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      } else {
        const token = await new Promise<string>(resolve => {
          subscribeTokenRefresh(resolve);
        });
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// --- LOCAL STORAGE HELPERS ---
const USER_ID_KEY = 'devblog_user_id';
const USER_KEY = 'devblog_user';

export const storage = {
  getUserId: (): string | null => localStorage.getItem(USER_ID_KEY),
  setUserId: (id: string): void => localStorage.setItem(USER_ID_KEY, id),
  removeUserId: (): void => localStorage.removeItem(USER_ID_KEY),

  getUser: (): User | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  setUser: (user: User): void => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: (): void => localStorage.removeItem(USER_KEY),

  clear: (): void => {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('devblog_token');
  }
};

// --- HTTP HELPER ---
async function request<T>(
  endpoint: string,
  options: AxiosRequestConfig = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await axiosInstance.request<T>({
      url: endpoint,
      ...options,
    });

    const data = response.data;

    // Check if the backend already wrapped the response
    if (data && typeof data === 'object' && 'data' in data && 'status' in data) {
      // Backend already wrapped it, extract the inner data
      return {
        status: (data as any).status || 'success',
        message: (data as any).message || 'Request successful',
        data: (data as any).data
      };
    }

    return {
      status: 'success',
      message: 'Request successful',
      data
    };
  } catch (err) {
    if (err instanceof AxiosError) {
      const errorData = err.response?.data;
      return Promise.reject({
        errorStatus: errorData?.errorStatus || 'error',
        errorMessage: errorData?.errorMessage || err.message || 'Request failed',
        errorCode: errorData?.errorCode || err.response?.status || 500,
        timestamp: errorData?.timestamp || new Date().toISOString()
      });
    }
    return Promise.reject({
      errorStatus: 'error',
      errorMessage: err instanceof Error ? err.message : 'Network error',
      errorCode: 500,
      timestamp: new Date().toISOString()
    });
  }
}

// --- GRAPHQL HELPER ---
async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, any>
): Promise<ApiResponse<T>> {
  try {
    console.log('[GraphQL] Request:', { query: query.substring(0, 100) + '...', variables });
    const response = await axiosInstance.post<{ data: T; errors?: any[] }>('/graphql', {
      query,
      variables,
    });

    const json = response.data;
    console.log('[GraphQL] Response:', { hasData: !!json.data, hasErrors: !!json.errors });

    if (json.errors) {
      console.error('[GraphQL] Errors:', JSON.stringify(json.errors, null, 2));
      return Promise.reject({
        errorStatus: 'error',
        errorMessage: json.errors[0]?.message || 'GraphQL error',
        errorCode: 400,
        errors: json.errors,
        timestamp: new Date().toISOString()
      });
    }

    return {
      status: 'success',
      message: 'Request successful',
      data: json.data
    };
  } catch (err) {
    console.error('[GraphQL] Exception:', err);
    if (err instanceof AxiosError) {
      const errorData = err.response?.data;
      return Promise.reject({
        errorStatus: 'error',
        errorMessage: errorData?.errors?.[0]?.message || err.message || 'GraphQL request failed',
        errorCode: err.response?.status || 500,
        timestamp: new Date().toISOString()
      });
    }
    return Promise.reject({
      errorStatus: 'error',
      errorMessage: err instanceof Error ? err.message : 'Network error',
      errorCode: 500,
      timestamp: new Date().toISOString()
    });
  }
}

// --- API IMPLEMENTATION ---
export const api = {
  auth: {
    login: async (req: LoginRequest): Promise<ApiResponse<User>> => {
      const response = await request<AuthResponse>('/api/auth/sign-in', {
        method: 'POST',
        data: req,
      });

      // Store user data and token on successful login
      if (response.data) {
        const authData = response.data;
        const user: User = {
          id: authData.user.id,
          username: authData.user.username,
          email: authData.user.email,
          name: authData.user.username,
          roles: authData.user.roles || [],
          accessToken: authData.accessToken,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (authData.accessToken) {
          tokenManager.setToken(authData.accessToken);
        }
        storage.setUserId(user.id);
        storage.setUser(user);

        return { ...response, data: user };
      }

      return response as unknown as ApiResponse<User>;
    },

    register: async (req: RegisterRequest): Promise<ApiResponse<User>> => {
      const response = await request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        data: req,
      });

      // Store user data and token on successful registration
      if (response.data) {
        const authData = response.data;
        const user: User = {
          id: authData.user.id,
          username: authData.user.username,
          email: authData.user.email,
          name: authData.user.username,
          roles: authData.user.roles || [],
          accessToken: authData.accessToken,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (authData.accessToken) {
          tokenManager.setToken(authData.accessToken);
        }
        storage.setUserId(user.id);
        storage.setUser(user);

        return { ...response, data: user };
      }

      return response as unknown as ApiResponse<User>;
    },

    logout: async (): Promise<void> => {
      try {
        const token = tokenManager.getToken();
        await request<void>('/api/auth/sign-out', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Sign out request failed:', error);
      } finally {
        storage.clear();
        tokenManager.removeToken();
      }
    },

    refreshToken: async (): Promise<ApiResponse<AuthResponse>> => {
      return request<AuthResponse>('/api/auth/refresh-token', {
        method: 'POST',
      });
    },

    // OAuth login with token
    loginWithToken: async (token: string): Promise<ApiResponse<User>> => {
      // Store token first for use in subsequent requests
      tokenManager.setToken(token);

      try {
        // Fetch current user profile using the token
        const response = await request<UserProfile>('/api/users/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // Store user data in localStorage
        if (response.data) {
          const profile = response.data;
          const user: User = {
            id: profile.userId,
            username: profile.username,
            email: profile.email,
            name: profile.username,
            roles: [], // Will be populated from token
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Try to get roles from token
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            user.roles = payload.roles || payload.authorities || [];
          } catch { }

          storage.setUserId(user.id);
          storage.setUser(user);

          return { ...response, data: user };
        }

        return response as unknown as ApiResponse<User>;
      } catch (error) {
        console.log('Failed to fetch user profile from /api/users/profile, attempting fallback...');

        // Fallback: Try to decode JWT and create basic user object
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const basicUser: User = {
            id: payload.sub || payload.userId || payload.id,
            name: payload.name || payload.given_name || 'User',
            email: payload.email || '',
            username: payload.username || payload.preferred_username || payload.email || '',
            roles: payload.roles || payload.authorities || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          storage.setUserId(basicUser.id);
          storage.setUser(basicUser);

          return {
            status: 'success',
            message: 'Logged in successfully',
            data: basicUser
          };
        } catch (jwtError) {
          // If JWT decode also fails, throw original error
          throw error;
        }
      }
    },

    // Get stored user from localStorage
    getStoredUser: (): User | null => {
      return storage.getUser();
    },

    // Get user profile - only supports current user
    getProfile: async (): Promise<ApiResponse<UserProfile>> => {
      return request<UserProfile>('/api/users/profile');
    }
  },

  posts: {
    getAll: async (
      page = 0,
      size = 10,
      options?: {
        sort?: 'id' | 'createdAt' | 'lastUpdated' | 'updatedAt' | 'title';
        order?: 'ASC' | 'DESC';
        author?: string;
        tags?: string[];
        search?: string;
      }
    ): Promise<ApiResponse<PaginatedResponse<Post>>> => {
      const sortBy = options?.sort === 'lastUpdated' ? 'updatedAt' : (options?.sort || 'updatedAt');
      const sortDirection = options?.order || 'DESC';

      const query = `
        query GetAllPosts($page: Int!, $size: Int!, $sortBy: String!, $sortDirection: String!, $author: String, $tags: [String!], $search: String) {
          getAllPosts(
            page: $page,
            size: $size,
            sortBy: $sortBy,
            sortDirection: $sortDirection,
            author: $author,
            tags: $tags,
            search: $search
          ) {
            content {
              id
              title
              updatedAt
              tags {
                name
              }
              totalComments
              author {
                username
              }
            }
            pageNumber
            pageSize
            totalElements
            totalPages
            last
          }
        }
      `;

      const variables: Record<string, any> = {
        page,
        size,
        sortBy,
        sortDirection,
      };

      // Add optional parameters if provided
      if (options?.author) {
        variables.author = options.author;
      }
      if (options?.tags && options.tags.length > 0) {
        variables.tags = options.tags;
      }
      if (options?.search) {
        variables.search = options.search;
      }

      const response = await graphqlRequest<{ getAllPosts: PaginatedResponse<Post> }>(query, variables);

      if (response.data) {
        return {
          status: 'success',
          message: 'Posts loaded successfully',
          data: response.data.getAllPosts
        };
      }

      return response as any;
    },

    getById: async (id: number): Promise<ApiResponse<Post>> => {
      return request<Post>(`/api/posts/${id}`);
    },

    create: async (req: CreatePostRequest): Promise<ApiResponse<Post>> => {
      return request<Post>('/api/posts', {
        method: 'POST',
        data: req,
      });
    },

    update: async (postId: number, req: UpdatePostRequest): Promise<ApiResponse<Post>> => {
      return request<Post>(`/api/posts/${postId}`, {
        method: 'PUT',
        data: req,
      });
    },

    delete: async (postId: number): Promise<ApiResponse<void>> => {
      return request<void>(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
    }
  },

  comments: {
    getByPostId: async (postId: number): Promise<ApiResponse<Comment[]>> => {
      return request<Comment[]>(`/api/comments/post/${postId}`);
    },

    getById: async (commentId: string): Promise<ApiResponse<Comment>> => {
      return request<Comment>(`/api/comments/${commentId}`);
    },

    create: async (req: CreateCommentRequest): Promise<ApiResponse<Comment>> => {
      return request<Comment>('/api/comments', {
        method: 'POST',
        data: req,
      });
    },

    delete: async (commentId: string, postId: number): Promise<ApiResponse<void>> => {
      return request<void>(`/api/comments/${commentId}`, {
        method: 'DELETE',
        data: { postId },
      });
    }
  },

  tags: {
    getPopular: async (): Promise<ApiResponse<Tag[]>> => {
      return request<Tag[]>('/api/tags/popular');
    }
  },

  metrics: {
    getAll: async (): Promise<ApiResponse<MetricsResponse>> => {
      try {
        const response = await axiosInstance.get<MetricsResponse>('/api/metrics/performance');
        return { status: 'success', message: 'Metrics retrieved', data: response.data };
      } catch (error: any) {
        const axiosError = error as AxiosError;
        throw {
          errorStatus: 'error',
          errorMessage: axiosError.message || 'Failed to fetch metrics',
          errorCode: axiosError.response?.status || 500,
          timestamp: new Date().toISOString()
        };
      }
    },

    getSummary: async (): Promise<ApiResponse<MetricsSummary>> => {
      try {
        const response = await axiosInstance.get<MetricsSummary>('/api/metrics/performance/summary');
        return { status: 'success', message: 'Summary retrieved', data: response.data };
      } catch (error: any) {
        const axiosError = error as AxiosError;
        throw {
          errorStatus: 'error',
          errorMessage: axiosError.message || 'Failed to fetch summary',
          errorCode: axiosError.response?.status || 500,
          timestamp: new Date().toISOString()
        };
      }
    },

    exportToLog: async (): Promise<ApiResponse<{ status: string; message: string }>> => {
      try {
        const response = await axiosInstance.post<{ status: string; message: string }>('/api/metrics/performance/export-log');
        return { status: 'success', message: 'Metrics exported', data: response.data };
      } catch (error: any) {
        const axiosError = error as AxiosError;
        throw {
          errorStatus: 'error',
          errorMessage: axiosError.message || 'Failed to export metrics',
          errorCode: axiosError.response?.status || 500,
          timestamp: new Date().toISOString()
        };
      }
    },

    reset: async (): Promise<ApiResponse<{ status: string; message: string }>> => {
      try {
        const response = await axiosInstance.delete<{ status: string; message: string }>('/api/metrics/performance/reset');
        return { status: 'success', message: 'Metrics reset', data: response.data };
      } catch (error: any) {
        const axiosError = error as AxiosError;
        throw {
          errorStatus: 'error',
          errorMessage: axiosError.message || 'Failed to reset metrics',
          errorCode: axiosError.response?.status || 500,
          timestamp: new Date().toISOString()
        };
      }
    },

    // Cache metrics
    getCacheMetrics: async (): Promise<ApiResponse<CacheMetricsResponse>> => {
      try {
        const response = await axiosInstance.get<CacheMetricsResponse>('/api/metrics/performance/cache');
        return { status: 'success', message: 'Cache metrics retrieved', data: response.data };
      } catch (error: any) {
        const axiosError = error as AxiosError;
        throw {
          errorStatus: 'error',
          errorMessage: axiosError.message || 'Failed to fetch cache metrics',
          errorCode: axiosError.response?.status || 500,
          timestamp: new Date().toISOString()
        };
      }
    },

    getCacheByName: async (cacheName: string): Promise<ApiResponse<CacheMetric>> => {
      try {
        const response = await axiosInstance.get<CacheMetric>(`/api/metrics/performance/cache/${cacheName}`);
        return { status: 'success', message: 'Cache metric retrieved', data: response.data };
      } catch (error: any) {
        const axiosError = error as AxiosError;
        throw {
          errorStatus: 'error',
          errorMessage: axiosError.message || 'Failed to fetch cache metric',
          errorCode: axiosError.response?.status || 500,
          timestamp: new Date().toISOString()
        };
      }
    },

    getCacheSummary: async (): Promise<ApiResponse<CacheSummary>> => {
      try {
        const response = await axiosInstance.get<CacheSummary>('/api/metrics/performance/cache/summary');
        return { status: 'success', message: 'Cache summary retrieved', data: response.data };
      } catch (error: any) {
        const axiosError = error as AxiosError;
        throw {
          errorStatus: 'error',
          errorMessage: axiosError.message || 'Failed to fetch cache summary',
          errorCode: axiosError.response?.status || 500,
          timestamp: new Date().toISOString()
        };
      }
    }
  },

  // Admin endpoints (require ADMIN role)
  admin: {
    getStats: async (): Promise<ApiResponse<AdminStats>> => {
      return request<AdminStats>('/api/admin/stats');
    },

    getPosts: async (
      page = 0,
      size = 10,
      options?: {
        sort?: 'id' | 'createdAt' | 'lastUpdated' | 'title';
        order?: 'ASC' | 'DESC';
        author?: string;
        tags?: string[];
        search?: string;
      }
    ): Promise<ApiResponse<PaginatedResponse<Post>>> => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });
      if (options?.sort) params.append('sort', options.sort);
      if (options?.order) params.append('order', options.order);
      if (options?.author) params.append('author', options.author);
      if (options?.tags) options.tags.forEach(tag => params.append('tags', tag));
      if (options?.search) params.append('search', options.search);

      return request<PaginatedResponse<Post>>(`/api/admin/posts?${params.toString()}`);
    },

    getPostById: async (postId: number): Promise<ApiResponse<Post>> => {
      return request<Post>(`/api/admin/posts/${postId}`);
    },

    deletePost: async (postId: number): Promise<ApiResponse<void>> => {
      return request<void>(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      });
    },

    getUsers: async (
      page = 0,
      size = 10,
      options?: {
        sort?: 'id' | 'createdAt' | 'username';
        order?: 'ASC' | 'DESC';
        search?: string;
      }
    ): Promise<ApiResponse<PaginatedResponse<AdminUser>>> => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });
      if (options?.sort) params.append('sort', options.sort);
      if (options?.order) params.append('order', options.order);
      if (options?.search) params.append('search', options.search);

      return request<PaginatedResponse<AdminUser>>(`/api/admin/users?${params.toString()}`);
    },

    getUserSummary: async (userId: string): Promise<ApiResponse<AdminUserSummary>> => {
      return request<AdminUserSummary>(`/api/admin/users/${userId}/summary`);
    },

    getComments: async (
      page = 0,
      size = 10,
      options?: {
        sort?: 'id' | 'createdAt';
        order?: 'ASC' | 'DESC';
        search?: string;
        postId?: number;
        author?: string;
      }
    ): Promise<ApiResponse<PaginatedResponse<AdminComment>>> => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });
      if (options?.sort) params.append('sort', options.sort);
      if (options?.order) params.append('order', options.order);
      if (options?.search) params.append('search', options.search);
      if (options?.postId) params.append('postId', options.postId.toString());
      if (options?.author) params.append('author', options.author);

      return request<PaginatedResponse<AdminComment>>(`/api/admin/comments?${params.toString()}`);
    },

    getCommentById: async (commentId: string): Promise<ApiResponse<AdminComment>> => {
      return request<AdminComment>(`/api/admin/comments/${commentId}`);
    },

    deleteComment: async (commentId: string): Promise<ApiResponse<void>> => {
      return request<void>(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      });
    }
  }
};
