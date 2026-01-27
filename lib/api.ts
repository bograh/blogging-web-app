import {
  User, LoginRequest, RegisterRequest, Post, CreatePostRequest, UpdatePostRequest,
  ApiResponse, PaginatedResponse, Comment, CreateCommentRequest,
  MetricsResponse, MetricsSummary, UserProfile, Tag
} from '@/types';

// --- API CONFIGURATION ---
const BASE_URL = 'http://localhost:8080';

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
  }
};

// --- HTTP HELPER ---
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content or empty responses
    const contentType = response.headers.get('content-type');
    const hasJson = contentType?.includes('application/json');
    const text = await response.text();
    const data = text && hasJson ? JSON.parse(text) : null;

    if (!response.ok) {
      // API returns error in specific format
      return Promise.reject({
        errorStatus: data?.errorStatus || 'error',
        errorMessage: data?.errorMessage || 'Request failed',
        errorCode: data?.errorCode || response.status,
        timestamp: data?.timestamp || new Date().toISOString()
      });
    }

    // For successful responses with no content (like DELETE), return success
    if (!data) {
      return { status: 'success', message: 'Operation successful' } as ApiResponse<T>;
    }

    return data as ApiResponse<T>;
  } catch (error: any) {
    // Network error or JSON parse error
    if (error.errorStatus) {
      throw error; // Re-throw API errors
    }
    throw {
      errorStatus: 'error',
      errorMessage: error.message || 'Network error',
      errorCode: 500,
      timestamp: new Date().toISOString()
    };
  }
}

// --- API IMPLEMENTATION ---
export const api = {
  auth: {
    login: async (req: LoginRequest): Promise<ApiResponse<User>> => {
      const response = await request<User>('/api/v1/users/sign-in', {
        method: 'POST',
        body: JSON.stringify(req),
      });

      // Store user data in localStorage on successful login
      if (response.data) {
        storage.setUserId(response.data.id);
        storage.setUser(response.data);
      }

      return response;
    },

    register: async (req: RegisterRequest): Promise<ApiResponse<User>> => {
      const response = await request<User>('/api/v1/users/register', {
        method: 'POST',
        body: JSON.stringify(req),
      });

      // Store user data in localStorage on successful registration
      if (response.data) {
        storage.setUserId(response.data.id);
        storage.setUser(response.data);
      }

      return response;
    },

    logout: (): void => {
      storage.clear();
    },

    // Get stored user from localStorage
    getStoredUser: (): User | null => {
      return storage.getUser();
    },

    // Get user profile
    getProfile: async (userId?: string): Promise<ApiResponse<UserProfile>> => {
      const id = userId || storage.getUserId();
      if (!id) {
        return Promise.reject({
          errorStatus: 'error',
          errorMessage: 'User not authenticated',
          errorCode: 401,
          timestamp: new Date().toISOString()
        });
      }
      return request<UserProfile>(`/api/v1/users/profile/${id}`);
    }
  },

  posts: {
    getAll: async (
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
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('size', String(size));

      if (options?.sort) params.append('sort', options.sort);
      if (options?.order) params.append('order', options.order);
      if (options?.author) params.append('author', options.author);
      if (options?.search) params.append('search', options.search);
      if (options?.tags) {
        options.tags.forEach(tag => params.append('tags', tag));
      }

      return request<PaginatedResponse<Post>>(`/api/v1/posts?${params.toString()}`);
    },

    getById: async (id: number): Promise<ApiResponse<Post>> => {
      return request<Post>(`/api/v1/posts/${id}`);
    },

    create: async (req: Omit<CreatePostRequest, 'authorId'> & { authorId?: string }): Promise<ApiResponse<Post>> => {
      const authorId = req.authorId || storage.getUserId();
      if (!authorId) {
        return Promise.reject({
          errorStatus: 'error',
          errorMessage: 'User not authenticated',
          errorCode: 401,
          timestamp: new Date().toISOString()
        });
      }

      return request<Post>('/api/v1/posts', {
        method: 'POST',
        body: JSON.stringify({ ...req, authorId }),
      });
    },

    update: async (postId: number, req: Omit<UpdatePostRequest, 'authorId'>): Promise<ApiResponse<Post>> => {
      const authorId = storage.getUserId();
      if (!authorId) {
        return Promise.reject({
          errorStatus: 'error',
          errorMessage: 'User not authenticated',
          errorCode: 401,
          timestamp: new Date().toISOString()
        });
      }

      return request<Post>(`/api/v1/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ ...req, authorId }),
      });
    },

    delete: async (postId: number): Promise<ApiResponse<void>> => {
      const authorId = storage.getUserId();
      if (!authorId) {
        return Promise.reject({
          errorStatus: 'error',
          errorMessage: 'User not authenticated',
          errorCode: 401,
          timestamp: new Date().toISOString()
        });
      }

      return request<void>(`/api/v1/posts/${postId}`, {
        method: 'DELETE',
        body: JSON.stringify({ authorId }),
      });
    }
  },

  comments: {
    getByPostId: async (postId: number): Promise<ApiResponse<Comment[]>> => {
      return request<Comment[]>(`/api/v1/comments/post/${postId}`);
    },

    getById: async (commentId: string): Promise<ApiResponse<Comment>> => {
      return request<Comment>(`/api/v1/comments/${commentId}`);
    },

    create: async (req: Omit<CreateCommentRequest, 'authorId'> & { authorId?: string }): Promise<ApiResponse<Comment>> => {
      const authorId = req.authorId || storage.getUserId();
      if (!authorId) {
        return Promise.reject({
          errorStatus: 'error',
          errorMessage: 'User not authenticated',
          errorCode: 401,
          timestamp: new Date().toISOString()
        });
      }

      return request<Comment>('/api/v1/comments', {
        method: 'POST',
        body: JSON.stringify({ ...req, authorId }),
      });
    },

    delete: async (commentId: string): Promise<ApiResponse<void>> => {
      const authorId = storage.getUserId();
      if (!authorId) {
        return Promise.reject({
          errorStatus: 'error',
          errorMessage: 'User not authenticated',
          errorCode: 401,
          timestamp: new Date().toISOString()
        });
      }

      return request<void>(`/api/v1/comments/${commentId}`, {
        method: 'DELETE',
        body: JSON.stringify({ authorId }),
      });
    }
  },

  tags: {
    getPopular: async (): Promise<ApiResponse<Tag[]>> => {
      return request<Tag[]>('/api/v1/tags/popular');
    }
  },

  metrics: {
    getAll: async (): Promise<ApiResponse<MetricsResponse>> => {
      try {
        const response = await fetch(`${BASE_URL}/api/metrics/performance`);
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const data = await response.json();
        return { status: 'success', message: 'Metrics retrieved', data };
      } catch (error: any) {
        throw {
          errorStatus: 'error',
          errorMessage: error.message || 'Failed to fetch metrics',
          errorCode: 500,
          timestamp: new Date().toISOString()
        };
      }
    },

    getSummary: async (): Promise<ApiResponse<MetricsSummary>> => {
      try {
        const response = await fetch(`${BASE_URL}/api/metrics/performance/summary`);
        if (!response.ok) {
          throw new Error('Failed to fetch summary');
        }
        const data = await response.json();
        return { status: 'success', message: 'Summary retrieved', data };
      } catch (error: any) {
        throw {
          errorStatus: 'error',
          errorMessage: error.message || 'Failed to fetch summary',
          errorCode: 500,
          timestamp: new Date().toISOString()
        };
      }
    },

    exportToLog: async (): Promise<ApiResponse<{ status: string; message: string }>> => {
      try {
        const response = await fetch(`${BASE_URL}/api/metrics/performance/export-log`, {
          method: 'POST',
        });
        if (!response.ok) {
          throw new Error('Failed to export metrics');
        }
        const data = await response.json();
        return { status: 'success', message: 'Metrics exported', data };
      } catch (error: any) {
        throw {
          errorStatus: 'error',
          errorMessage: error.message || 'Failed to export metrics',
          errorCode: 500,
          timestamp: new Date().toISOString()
        };
      }
    },

    reset: async (): Promise<ApiResponse<{ status: string; message: string }>> => {
      try {
        const response = await fetch(`${BASE_URL}/api/metrics/performance/reset`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to reset metrics');
        }
        const data = await response.json();
        return { status: 'success', message: 'Metrics reset', data };
      } catch (error: any) {
        throw {
          errorStatus: 'error',
          errorMessage: error.message || 'Failed to reset metrics',
          errorCode: 500,
          timestamp: new Date().toISOString()
        };
      }
    }
  }
};
