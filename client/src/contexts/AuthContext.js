// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || "//localhost:5000/api";

// Provide a default shape for the context
const defaultAuthContext = {
  token: null,
  currentUser: null,
  isAuthenticated: false,
  loading: true, // Start with loading true
  login: async () => ({ success: false, message: 'Not initialized' }),
  register: async () => ({ success: false, message: 'Not initialized' }),
  logout: () => {},
};

const AuthContext = createContext(defaultAuthContext);

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('currentUser');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true); // Still important for consumers

  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUserString = localStorage.getItem('currentUser');

      if (storedToken) {
        setToken(storedToken); // This will trigger the other useEffect for axios
        if (storedUserString) {
          try {
            setCurrentUser(JSON.parse(storedUserString));
          } catch (e) {
            localStorage.removeItem('currentUser');
          }
        }
      } else {
        // Clear any potentially lingering headers if no token
        delete axios.defaults.headers.common['Authorization'];
        setCurrentUser(null);
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (username, password) => {
    setLoading(true); // Indicate loading during login
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      const userData = { id: res.data.userId, username: res.data.username };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setToken(res.data.token);
      setCurrentUser(userData);
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Login error", error.response ? error.response.data : error.message);
      setLoading(false);
      return { success: false, message: error.response?.data?.msg || 'Login failed' };
    }
  };

  const register = async (username, password) => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, { username, password });
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Registration error", error.response ? error.response.data : error.message);
      setLoading(false);
      return { success: false, message: error.response?.data?.msg || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setToken(null);
    setCurrentUser(null);
    // Axios header cleared by token useEffect
  };

  // IMPORTANT: The context value should always have a consistent shape.
  // `isAuthenticated` is derived from `token`.
  const contextValue = {
    token,
    currentUser,
    isAuthenticated: !!token,
    loading, // Consumers will use this to wait for auth to be ready
    login,
    register,
    logout,
  };

  // The children are rendered regardless of the AuthProvider's internal loading state.
  // Consumers (like ProtectedRoute or BudgetsProvider) will use the `loading` flag from context.
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
