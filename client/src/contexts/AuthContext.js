import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from "react-bootstrap"; // For AuthProvider's own loading UI

const API_URL = process.env.REACT_APP_API_URL || "//localhost:5000/api";

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
    // console.log("AuthProvider: Mount & Initial Effect - Start");
    const storedToken = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('currentUser');

    if (storedToken) {
      // console.log("AuthProvider: Token found in localStorage.");
      setToken(storedToken);
      if (storedUserString) {
        try {
          const parsedUser = JSON.parse(storedUserString);
          setCurrentUser(parsedUser);
          // console.log("AuthProvider: User found in localStorage.", parsedUser);
        } catch (e) {
          console.error("AuthProvider: Error parsing stored currentUser", e);
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } else {
      // console.log("AuthProvider: No token found in localStorage.");
      setCurrentUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
    // console.log("AuthProvider: Initial Effect - Setting internalLoading to false.");
    setInternalLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      // console.log("AuthProvider: Token state updated, setting Axios header.");
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      // console.log("AuthProvider: Token state is null/cleared, deleting Axios header.");
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

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
      console.error("Login error:", error.response ? error.response.data : error.message);
      return { success: false, message: error.response?.data?.msg || 'Login failed' };
    }
  };

  const register = async (username, password) => {
    try {
      await axios.post(`${API_URL}/auth/register`, { username, password });
      return { success: true };
    } catch (error) {
      console.error("Registration error:", error.response ? error.response.data : error.message);
      return { success: false, message: error.response?.data?.msg || 'Registration failed' };
    }
  };

  const logout = () => {
    // console.log("AuthProvider: Logging out.");
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
    // console.log("AuthProvider: Is loading (internalLoading is true). Showing init message.");
    return <Container className="my-4" style={{textAlign: 'center'}}><p>Initializing Authentication...</p></Container>;
  }

  // console.log("AuthProvider: internalLoading is false. Rendering Provider with children. Context loading state will be:", contextValue.loading);
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
