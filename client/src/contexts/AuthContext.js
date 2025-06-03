// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from "react-bootstrap"; // For AuthProvider's own loading message

const API_URL = process.env.REACT_APP_API_URL || "//localhost:5000/api";

const defaultAuthContextValue = {
  token: null,
  currentUser: null,
  isAuthenticated: false,
  loading: true, // Consumers see this as true initially
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
  const [internalLoading, setInternalLoading] = useState(true); // AuthProvider's own setup loading

  useEffect(() => {
    console.log("AuthProvider: Mount & Initial Effect - START");
    // Simulate a quick check (like reading localStorage)
    const storedToken = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('currentUser');

    if (storedToken) {
      setToken(storedToken); // Will trigger header update via separate useEffect
      if (storedUserString) {
        try {
          setCurrentUser(JSON.parse(storedUserString));
        } catch (e) {
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
      }
    } else {
      setCurrentUser(null); // Explicitly set to null if no token
    }

    // This is the most important part for this issue:
    // Ensure internalLoading becomes false AFTER initial setup.
    console.log("AuthProvider: Initial Effect - Setting internalLoading to false.");
    setInternalLoading(false);

  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // LOGIN, REGISTER, LOGOUT functions (ensure they are complete as per previous versions)
  const login = async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      const userData = { id: res.data.userId, username: res.data.username };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setToken(res.data.token);
      setCurrentUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.msg || 'Login failed' };
    }
  };

  const register = async (username, password) => {
    try {
      await axios.post(`${API_URL}/auth/register`, { username, password });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.msg || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setToken(null);
    setCurrentUser(null);
  };
  // --- End of Auth Functions ---

  const contextValue = {
    token,
    currentUser,
    isAuthenticated: !!token,
    loading: internalLoading, // This 'loading' is what consumers will get
    login,
    register,
    logout,
  };

  // AuthProvider renders its children ONLY when its internalLoading is false.
  // When it does render children, the contextValue will have `loading: false`.
  if (internalLoading) {
    console.log("AuthProvider: Is loading (internalLoading is true). Showing init message.");
    return <Container className="my-4"><p>Initializing Authentication...</p></Container>;
  }

  // console.log("AuthProvider: internalLoading is false. Rendering Provider with children. Context loading will be:", contextValue.loading);
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
