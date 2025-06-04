// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from "react-bootstrap";

// Updated API_URL definition to use the new production endpoint as fallback
const API_URL = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";

const defaultAuthContextValue = {
  token: null,
  currentUser: null,
  isAuthenticated: false,
  loading: true,
  login: async () => { console.error("Login function not ready"); return { success: false, message: 'Auth not ready' }; },
  register: async () => { console.error("Register function not ready"); return { success: false, message: 'Auth not ready' }; },
  logout: () => { console.error("Logout function not ready"); },
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
    console.log("AuthProvider: Using API_URL:", API_URL); // Verify correct URL
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
      delete axios.defaults.headers.common['Authorization'];
    }
    setInternalLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (username, password) => {
    const targetUrl = `${API_URL}/auth/login`;
    console.log(`CLIENT: Attempting to POST to LOGIN: ${targetUrl}`);
    try {
      const res = await axios.post(targetUrl, { username, password });
      localStorage.setItem('token', res.data.token);
      const userData = { id: res.data.userId, username: res.data.username };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setToken(res.data.token);
      setCurrentUser(userData);
      return { success: true };
    } catch (error) {
      console.error("CLIENT: Login error - Status:", error.response?.status, "Data:", error.response?.data, "Message:", error.message, "Request to:", targetUrl);
      return { success: false, message: error.response?.data?.msg || `Login failed: ${error.message}` };
    }
  };

  const register = async (username, password) => {
    const targetUrl = `${API_URL}/auth/register`;
    console.log(`CLIENT: Attempting to POST to REGISTER: ${targetUrl} with username: ${username}`);
    try {
      const response = await axios.post(targetUrl, { username, password });
      if (response.status === 201 || response.status === 200) {
        console.log("CLIENT: Registration API call successful:", response.data);
        return { success: true };
      } else {
        console.warn("CLIENT: Registration API call returned non-2xx status:", response.status, response.data);
        return { success: false, message: response.data?.msg || `Registration failed with status ${response.status}` };
      }
    } catch (error) {
      let message = 'Registration failed. Please try again.';
      if (error.response) {
        console.error("CLIENT: Registration API error - Status:", error.response.status, "Data:", error.response.data, "Request to:", targetUrl);
        message = error.response.data.msg || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error("CLIENT: Registration network error - No response received. Request to:", targetUrl, "Error details:", error.request);
        message = `Network error or server is not responding at ${targetUrl}. Ensure backend is running and API_URL is correct.`;
      } else {
        console.error('CLIENT: Registration setup error - Error message:', error.message, "Request to:", targetUrl);
        message = `Client-side error before sending request: ${error.message}`;
      }
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
