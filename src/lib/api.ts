const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Tribute {
  id: number;
  name: string;
  relationship: string;
  message: string;
  date: string;
  created_at: string;
  // Map from database fields
  author_name?: string;
  author_relationship?: string;
}

export interface CandleStats {
  totalCandles: number;
  message: string;
}

export interface TributeSubmission {
  name: string;
  relationship: string;
  message: string;
  email?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new ApiError(
      data.error || 'API request failed',
      response.status,
      data.details
    );
  }
  
  return data;
};

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error occurred', 0);
  }
};

// Tribute API
export const tributesApi = {
  // Get approved tributes with pagination
  getTributes: async (page = 1, limit = 20, status: 'approved' | 'pending' | 'all' = 'approved') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
    });
    
    return apiRequest<{ tributes: Tribute[]; pagination: any }>(
      `/tributes?${params}`
    );
  },

  // Submit new tribute
  submitTribute: async (tribute: TributeSubmission) => {
    return apiRequest<{ message: string; tributeId: number; status: string }>(
      '/tributes',
      {
        method: 'POST',
        body: JSON.stringify(tribute),
      }
    );
  },

  // Get tribute statistics
  getTributeStats: async () => {
    return apiRequest<{
      totalTributes: number;
      approvedTributes: number;
      pendingTributes: number;
      latestSubmissionDate: string;
    }>('/tributes/stats');
  },
};

// Candle API
export const candlesApi = {
  // Light a new candle
  lightCandle: async () => {
    return apiRequest<{ message: string; candleId: number; litAt: string }>(
      '/candles',
      {
        method: 'POST',
        body: JSON.stringify({}),
        // Add longer timeout for candle API
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    );
  },

  // Get total candle count
  getCandleCount: async () => {
    return apiRequest<CandleStats>('/candles/count', {
      // Add longer timeout for candle API
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
  },

  // Get recent candle activity
  getRecentCandles: async (limit = 50) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    return apiRequest<{ candles: any[]; total: number }>(`/candles/recent?${params}`, {
      // Add longer timeout for candle API
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
  },

  // Get candle statistics
  getCandleStats: async () => {
    return apiRequest<{
      totalCandles: number;
      uniqueVisitors: number;
      latestCandleDate: string;
      latestCandleTime: string;
      dailyActivity: any[];
    }>('/candles/stats');
  },
};

// Auth API (for admin panel)
export const authApi = {
  // Admin login
  login: async (username: string, password: string) => {
    return apiRequest<{
      message: string;
      token: string;
      user: { id: number; username: string; email?: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  // Get current user info
  getMe: async (token: string) => {
    return apiRequest<{ user: any }>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Logout
  logout: async (token: string) => {
    return apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Admin API
export const adminApi = {
  // Get dashboard data
  getDashboard: async (token: string) => {
    return apiRequest<any>('/admin/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Manage tributes
  getTributes: async (token: string, page = 1, limit = 20, status: 'approved' | 'pending' | 'all' = 'all') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
    });
    
    return apiRequest<{ tributes: any[]; pagination: any }>(
      `/admin/tributes?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  // Approve tribute
  approveTribute: async (token: string, tributeId: number) => {
    return apiRequest<{ message: string; tributeId: number; tributeName: string }>(
      `/admin/tributes/${tributeId}/approve`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  // Delete tribute
  deleteTribute: async (token: string, tributeId: number) => {
    return apiRequest<{ message: string; tributeId: number; tributeName: string }>(
      `/admin/tributes/${tributeId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  // Get analytics
  getAnalytics: async (token: string, days = 30) => {
    const params = new URLSearchParams({ days: days.toString() });
    return apiRequest<any>(`/admin/analytics?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Health check
export const healthCheck = async () => {
  return apiRequest<{ status: string; timestamp: string; uptime: number; environment: string }>('/health');
};

export { ApiError };
