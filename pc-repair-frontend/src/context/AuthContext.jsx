import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/apiService';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      // Optionally fetch fresh user data
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // If profile fetch fails, clear auth data
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { tokens, user: userData } = response.data;

      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Login failed';
      toast.error(errorMessage);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      toast.success('Registration successful! Please login.');
      return true;
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData) {
        // Handle validation errors
        Object.keys(errorData).forEach((key) => {
          const messages = errorData[key];
          if (Array.isArray(messages)) {
            messages.forEach((msg) => toast.error(`${key}: ${msg}`));
          } else {
            toast.error(`${key}: ${messages}`);
          }
        });
      } else {
        toast.error('Registration failed');
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      toast.error('Failed to update profile');
      return false;
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.user_type === 'admin';
  const isTechnician = user?.user_type === 'technician';
  const isClient = user?.user_type === 'client';

  const value = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isTechnician,
    isClient,
    login,
    register,
    logout,
    updateProfile,
    fetchProfile,
    refreshUser: fetchProfile, // Alias for clarity
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
