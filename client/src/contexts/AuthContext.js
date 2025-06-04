// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from "react-bootstrap";

const API_URL = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";
console.log("CLIENT AuthContext: API_URL is set to:", API_URL);
if (!process.env.REACT_APP_API_URL) {
  console.warn("CLIENT AuthContext: REACT_APP_API_URL is not set in .env, using fallback:", API_URL);
}

const defaultAuthContextValue = {
  token: null, currentUser: null, isAuthenticated: false, loading: true,
  login: async () => ({ success: false, message: 'Auth not ready' }),
  register: async () => ({ success: false, message: 'Auth not ready' }),
  logout: () => {},
};

const AuthContext = createContext(defaultAuthContextValue);

export function useAuth() { return useContext(AuthContext); }

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('currentUser');
    if (storedToken) {
      setToken(storedToken); // Triggers the [token] useEffect below
      if (storedUserString) {
        try { setCurrentUser(JSON.parse(storedUserString)); }
        catch (e) { localStorage.removeItem('currentUser'); setCurrentUser(null); }
      }
    } else {
      setCurrentUser(null);
      // Explicitly ensure header is clear if no token on initial load AND token state is already null
      if (axios.defaults.headers.common['Authorization']) {
          console.log("CLIENT AuthContext Initializer: No stored token, ensuring Axios header is clear.");
          delete axios.defaults.headers.common['Authorization'];
      }
    }
    setInternalLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      console.log("CLIENT AuthContext TokenEffect: Token state updated to a TRUTHY value. Setting Axios default Authorization header. Token starts with:", token.substring(0, 20));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      console.log("CLIENT AuthContext TokenEffect: Token state updated to a FALSY value (null/undefined). Deleting Axios default Authorization header.");
      delete axios.defaults.headers.common['Authorization'];
    }
    // Log current defaults to confirm
    // console.log("CLIENT AuthContext TokenEffect: Current Axios default headers:", JSON.stringify(axios.defaults.headers.common));
  }, [token]);

  const login = async (username, password) => {
    const targetUrl = `${API_URL}/auth/login`;
    try {
      const res = await axios.post(targetUrl, { username, password });
      localStorage.setItem('token', res.data.token);
      const userData = { id: res.data.userId, username: res.data.username };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      console.log("CLIENT AuthContext login: Login API success. About to setToken state with token starting:", res.data.token.substring(0,20));
      setToken(res.data.token); // This triggers the useEffect above
      setCurrentUser(userData);
      return { success: true };
    } catch (error) { /* ... (error logging as before) ... */ 
      console.error("CLIENT AuthContext: Login error -", error.response ? `${error.response.status} ${JSON.stringify(error.response.data)}` : error.message);
      return { success: false, message: error.response?.data?.msg || `Login failed: ${error.message || 'Please try again.'}` };
    }
  };

  const register = async (username, password) => {
    const targetUrl = `${API_URL}/auth/register`;
    try {
      const response = await axios.post(targetUrl, { username, password });
      return { success: true, data: response.data };
    } catch (error) { /* ... (error logging as before) ... */ 
      let message = 'Registration failed.';
      if (error.response) message = error.response.data.msg || `Server error: ${error.response.status}`;
      else if (error.request) message = `Network error at ${targetUrl}.`;
      else message = `Client error: ${error.message}`;
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setToken(null); // Triggers useEffect to clear header
    setCurrentUser(null);
  };

  const contextValue = { token, currentUser, isAuthenticated: !!token, loading: internalLoading, login, register, logout };

  if (internalLoading) {
    return <Container className="my-4" style={{ textAlign: 'center' }}><p>Initializing Authentication...</p></Container>;
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
