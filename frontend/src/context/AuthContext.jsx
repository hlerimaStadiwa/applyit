import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(true);

  // Set up request interceptor to attach bearer token
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [accessToken]);

  // Set up response interceptor to handle token refresh on 401
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
          originalRequest._retry = true;
          try {
            // Attempt to refresh the access token
            const res = await axios.post('http://localhost:8000/api/v1/auth/refresh', {
              refresh_token: refreshToken,
            });
            const { access_token, refresh_token: new_refresh_token } = res.data;
            
            // Save new tokens
            localStorage.setItem('accessToken', access_token);
            localStorage.setItem('refreshToken', new_refresh_token);
            setAccessToken(access_token);
            setRefreshToken(new_refresh_token);
            
            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear session
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshToken]);

  // Load current user profile on mount (or when access token changes)
  useEffect(() => {
    const loadUser = async () => {
      if (accessToken) {
        try {
          const res = await api.get('/users/me');
          setUser(res.data);
        } catch (error) {
          console.error("Error loading user profile", error);
          // If loading me fails, interceptor might have already tried refreshing.
          // If both fail, reset credentials.
          if (error.response?.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [accessToken]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user: userData } = response.data;
      
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
      setUser(userData);
      
      return userData;
    } catch (error) {
      throw error.response?.data?.detail || 'Login failed. Please check your credentials.';
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, fullName) => {
    try {
      await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      });
    } catch (error) {
      throw error.response?.data?.detail || 'Registration failed. Please try again.';
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
