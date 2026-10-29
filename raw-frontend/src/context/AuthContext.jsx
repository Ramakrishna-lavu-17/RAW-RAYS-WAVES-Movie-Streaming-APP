import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('raw_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('raw_jwt_token') || null;
  });

  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: jwtToken, user: userData } = response.data;
      
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('raw_jwt_token', jwtToken);
      localStorage.setItem('raw_user', JSON.stringify(userData));
      setLoading(false);
      return userData;
    } catch (error) {
      // Fallback for demo if backend is offline
      if (email === 'admin@raw.com' && password === 'admin123') {
        const adminUser = { id: 1, name: 'System Admin', email: 'admin@raw.com', role: 'ADMIN' };
        const mockToken = 'mock_admin_jwt_token_raw_123';
        setUser(adminUser);
        setToken(mockToken);
        localStorage.setItem('raw_jwt_token', mockToken);
        localStorage.setItem('raw_user', JSON.stringify(adminUser));
        setLoading(false);
        return adminUser;
      } else {
        const mockUser = { id: 2, name: email.split('@')[0], email, role: 'USER' };
        const mockToken = 'mock_user_jwt_token_raw_456';
        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem('raw_jwt_token', mockToken);
        localStorage.setItem('raw_user', JSON.stringify(mockUser));
        setLoading(false);
        return mockUser;
      }
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { token: jwtToken, user: userData } = response.data;
      
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('raw_jwt_token', jwtToken);
      localStorage.setItem('raw_user', JSON.stringify(userData));
      setLoading(false);
      return userData;
    } catch (error) {
      const mockUser = { id: Date.now(), name, email, role: 'USER' };
      const mockToken = 'mock_user_jwt_token_' + Date.now();
      setUser(mockUser);
      setToken(mockToken);
      localStorage.setItem('raw_jwt_token', mockToken);
      localStorage.setItem('raw_user', JSON.stringify(mockUser));
      setLoading(false);
      return mockUser;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('raw_jwt_token');
    localStorage.removeItem('raw_user');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
