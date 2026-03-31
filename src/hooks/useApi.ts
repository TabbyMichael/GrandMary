import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { tributesApi, candlesApi, ApiError, type Tribute, type TributeSubmission, type CandleStats } from '@/lib/api';

export const useTributes = (initialPage = 1, initialLimit = 20) => {
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: initialLimit,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchTributes = async (page = pagination.currentPage, limit = pagination.itemsPerPage) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tributesApi.getTributes(page, limit, 'approved');
      if (response.data) {
        setTributes(response.data.tributes);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
      toast.error('Failed to load tributes');
    } finally {
      setLoading(false);
    }
  };

  const submitTribute = async (tribute: TributeSubmission) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tributesApi.submitTribute(tribute);
      if (response.data) {
        toast.success(response.data.message);
        // Refresh tributes after successful submission
        await fetchTributes();
        return response.data;
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
      toast.error(apiError.message);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTributes();
  }, []);

  return {
    tributes,
    loading,
    error,
    pagination,
    fetchTributes,
    submitTribute,
    refetch: () => fetchTributes(),
  };
};

export const useCandles = () => {
  const [candleCount, setCandleCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentCandles, setRecentCandles] = useState<any[]>([]);

  const fetchCandleCount = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await candlesApi.getCandleCount();
      if (response.data) {
        setCandleCount(response.data.totalCandles);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
      console.error('Failed to fetch candle count:', apiError);
      // Don't show toast for candle count errors to avoid spamming users
    } finally {
      setLoading(false);
    }
  };

  const lightCandle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await candlesApi.lightCandle();
      if (response.data) {
        toast.success(response.data.message);
        // Update candle count after lighting
        setCandleCount(prev => prev + 1);
        return response.data;
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
      toast.error(apiError.message);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentCandles = async (limit = 50) => {
    try {
      const response = await candlesApi.getRecentCandles(limit);
      if (response.data) {
        setRecentCandles(response.data.candles);
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Failed to fetch recent candles:', apiError);
    }
  };

  useEffect(() => {
    fetchCandleCount();
    fetchRecentCandles();
  }, []);

  return {
    candleCount,
    loading,
    error,
    recentCandles,
    fetchCandleCount,
    lightCandle,
    fetchRecentCandles,
  };
};

export const useApiHealth = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/health`);
      setIsHealthy(response.ok);
      
      if (!response.ok) {
        setError('API server is not responding');
      }
    } catch (err) {
      setIsHealthy(false);
      setError('Cannot connect to API server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    isHealthy,
    loading,
    error,
    checkHealth,
  };
};

export const useApi = () => {
  const get = async (endpoint: string) => {
    const currentToken = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const put = async (endpoint: string) => {
    const currentToken = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const deleteRequest = async (endpoint: string) => {
    const currentToken = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  return {
    get,
    put,
    delete: deleteRequest,
    token: localStorage.getItem('adminToken'),
  };
};

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('adminToken', data.token);
          setIsAuthenticated(true);
          toast.success('Login successful');
          return true;
        }
      }
    } catch (error) {
      toast.error('Login failed');
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  const checkAuth = () => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    setLoading(false);
  };

  return {
    isAuthenticated,
    loading,
    token,
    login,
    logout,
    checkAuth,
  };
};
