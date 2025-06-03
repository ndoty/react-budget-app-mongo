// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from "react-bootstrap"; // For the AuthProvider's own loading message

const API_URL = process.env.REACT_APP_API_URL || "//localhost:5000/api";

const defaultAuthContextValue = {
  token: null,
  currentUser: null,
  isAuthenticated: false,
  loading: true, // Consumers expect this to be true initially
  login: async () => { throw new Error("Login not ready"); },
  register: async () => { throw new Error("Register not ready"); },
  logout: () => { throw new Error("Logout not ready"); },
};

const AuthContext = createContext(defaultAuthContextValue);

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null); // Initialize as null
  const [currentUser, setCurrentUser] = useState(null);
  const [internalLoading, setInternalLoading] = useState(true); // AuthProvider's own loading

  useEffect(() => {
    console.log("AuthProvider: Initialization Effect - Start");
    const storedToken = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('currentUser');

    if (storedToken) {
      setToken(storedToken); // This will trigger the axios header update via the other useEffect
      if (storedUserString) {
        try {
          setCurrentUser(JSON.parse(storedUserString));
        } catch (e) {
          console.error("AuthProvider: Error parsing stored currentUser", e);
          localStorage.removeItem('currentUser'); // Clear corrupted data
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null); // No stored user
      }
    } else {
      // No token, ensure currentUser is null and axios header is clear
      setCurrentUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
    console.log("AuthProvider: Initialization Effect - Setting internalLoading to false");
    setInternalLoading(false);
  }, []); // Runs once on mount

  useEffect(() => {
    // Manages Axios header based on token changes
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (username, password) => {
    // Omitted for brevity, should be same as previous functional version
    // Ensure it sets token and currentUser, and localStorage
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      const userData = { id: res.data.userId, username: res.data.username };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setToken(res.data.token); 
      setCurrentUser(userData);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error.response ? error.response.data : error.message);
      return { success: false, message: error.response?.data?.msg || 'Login failed' };
    }
  };

  const register = async (username, password) => {
    // Omitted for brevity
    try {
      await axios.post(`${API_URL}/auth/register`, { username, password });
      return { success: true };
    } catch (error) {
      console.error("Registration error:", error.response ? error.response.data : error.message);
      return { success: false, message: error.response?.data?.msg || 'Registration failed' };
    }
  };

  const logout = () => {
    // Omitted for brevity
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setToken(null); 
    setCurrentUser(null);
  };

  const contextValue = {
    token,
    currentUser,
    isAuthenticated: !!token,
    loading: internalLoading, // Consumers use this 'loading'
    login,
    register,
    logout,
  };

  // If AuthProvider itself is loading, show a message and don't render children yet.
  // This ensures that when children (like BudgetsProvider) are rendered,
  // the AuthContext they consume will have `loading: false`.
  if (internalLoading) {
    // console.log("AuthProvider: Rendering internal loading state.");
    return <Container className="my-4"><p>Initializing Authentication...</p></Container>;
  }

  // console.log("AuthProvider: Rendering Provider with children. Context loading state:", contextValue.loading);
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
