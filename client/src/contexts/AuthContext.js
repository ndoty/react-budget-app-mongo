// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from "react-bootstrap";

const API_URL = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";

const defaultAuthContextValue = {
  token: null,
  currentUser: null,
  isAuthenticated: false,
  loading: true,
  login: async () => ({ success: false, message: 'Auth not ready' }),
  register: async () => ({ success: false, message: 'Auth not ready' }),
  logout: () => {},
};

const AuthContext = createContext(defaultAuthContextValue);

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('currentUser');
    if (storedToken) {
      setToken(storedToken);
      if (storedUserString) {
        try {
          setCurrentUser(JSON.parse(storedUserString));
        } catch (e) {
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
    setInternalLoading(false);
  }, []);

  const login = async (username, password) => {
    const targetUrl = `${API_URL}/auth/login`;
    try {
      const res = await axios.post(targetUrl, { username, password });
      localStorage.setItem('token', res.data.token);
      const userData = { id: res.data.userId, username: res.data.username };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setToken(res.data.token);
      setCurrentUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.msg || `Login failed: ${error.message || 'Please try again.'}` };
    }
  };

  const register = async (username, password) => {
    const targetUrl = `${API_URL}/auth/register`;
    try {
      const response = await axios.post(targetUrl, { username, password });
       if (response.status === 201 || response.status === 200) {
        return { success: true };
      } else {
        return { success: false, message: response.data?.msg || `Registration failed with status ${response.status}` };
      }
    } catch (error) {
      let message = 'Registration failed. Please try again.';
      if (error.response) message = error.response.data.msg || `Server error: ${error.response.status}`;
      else if (error.request) message = `Network error at ${targetUrl}.`;
      else message = `Client-side error: ${error.message}`;
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setToken(null);
    setCurrentUser(null);
  };

  const contextValue = {
    token,
    currentUser,
    isAuthenticated: !!token,
    loading: internalLoading,
    login,
    register,
    logout,
  };

  if (internalLoading) {
    return <Container className="my-4" style={{ textAlign: 'center' }}><p>Initializing Authentication...</p></Container>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
