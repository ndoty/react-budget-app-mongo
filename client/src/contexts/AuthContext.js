import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
// Remove Container import if not used here for a global loader for AuthProvider itself
// import { Container } from "react-bootstrap";

const API_URL = process.env.REACT_APP_API_URL || "//localhost:5000/api";

const defaultAuthContext = {
  token: null,
  currentUser: null,
  isAuthenticated: false,
  loading: true, // Crucial: consumers will see loading true initially
  login: async () => ({ success: false, message: 'AuthContext not fully initialized' }),
  register: async () => ({ success: false, message: 'AuthContext not fully initialized' }),
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
  // This 'internalLoading' is for AuthProvider's own setup.
  // The 'loading' in contextValue will reflect this.
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    // console.log("AuthProvider useEffect: Initializing...");
    const storedToken = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('currentUser');

    if (storedToken) {
      setToken(storedToken); // Triggers other useEffect for axios header
      if (storedUserString) {
        try {
          setCurrentUser(JSON.parse(storedUserString));
        } catch (e) {
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
      }
    } else {
      // Ensure currentUser is null if no token
      setCurrentUser(null);
    }
    setInternalLoading(false); // Mark AuthProvider's setup as complete
    // console.log("AuthProvider useEffect: Initialization complete. internalLoading: false");
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (username, password) => {
    // setInternalLoading(true); // Optional: manage loading state for API calls
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      const userData = { id: res.data.userId, username: res.data.username };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setToken(res.data.token);
      setCurrentUser(userData);
      // setInternalLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Login error", error.response ? error.response.data : error.message);
      // setInternalLoading(false);
      return { success: false, message: error.response?.data?.msg || 'Login failed' };
    }
  };

  const register = async (username, password) => {
    // setInternalLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, { username, password });
      // setInternalLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Registration error", error.response ? error.response.data : error.message);
      // setInternalLoading(false);
      return { success: false, message: error.response?.data?.msg || 'Registration failed' };
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
    loading: internalLoading, // This is the loading state consumers will use
    login,
    register,
    logout,
  };

  // AuthProvider now ALWAYS renders the Provider and its children.
  // The 'loading' state is handled by consumers.
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
