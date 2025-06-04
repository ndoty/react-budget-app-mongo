// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from "react-bootstrap";

const API_URL = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";
console.log("AuthContext: API_URL is set to:", API_URL);

const defaultAuthContextValue = {
  token: null,
  currentUser: null,
  isAuthenticated: false,
  loading: true,
  login: async () => { return { success: false, message: 'Auth not ready' }; },
  register: async () => { return { success: false, message: 'Auth not ready' }; },
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

  // Effect to initialize auth state from localStorage on component mount
  useEffect(() => {
    // console.log("AuthProvider Initializer: START");
    const storedToken = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('currentUser');

    if (storedToken) {
      // console.log("AuthProvider Initializer: Token found in localStorage.", storedToken.substring(0,10) + "...");
      setToken(storedToken); // This will trigger the token-dependent useEffect below
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
      // console.log("AuthProvider Initializer: No token found in localStorage.");
      setCurrentUser(null);
      // Ensure Axios header is clear if no token from the start
      delete axios.defaults.headers.common['Authorization'];
    }
    setInternalLoading(false);
    // console.log("AuthProvider Initializer: END, internalLoading set to false.");
  }, []);

  // Effect to manage Axios default Authorization header whenever the token state changes
  useEffect(() => {
    if (token) {
      console.log("AuthProvider TokenEffect: Token EXISTS. Setting Axios default Authorization header.", token.substring(0,10) + "...");
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      console.log("AuthProvider TokenEffect: Token is NULL/empty. Deleting Axios default Authorization header.");
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]); // This effect specifically depends on the token state

  const login = async (username, password) => {
    const targetUrl = `${API_URL}/auth/login`;
    // console.log(`CLIENT AuthContext: Attempting to POST to LOGIN: ${targetUrl}`);
    try {
      const res = await axios.post(targetUrl, { username, password });
      localStorage.setItem('token', res.data.token);
      const userData = { id: res.data.userId, username: res.data.username };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // CRITICAL: Update the token state, which will trigger the useEffect above to set Axios headers
      setToken(res.data.token);
      setCurrentUser(userData);
      console.log("CLIENT AuthContext: Login successful. Token state set.");
      return { success: true };
    } catch (error) {
      console.error("CLIENT AuthContext: Login error -", error.response ? `${error.response.status} ${JSON.stringify(error.response.data)}` : error.message);
      return { success: false, message: error.response?.data?.msg || `Login failed: ${error.message || 'Please try again.'}` };
    }
  };

  const register = async (username, password) => {
    const targetUrl = `${API_URL}/auth/register`;
    // ... (register logic as before)
    try {
      const response = await axios.post(targetUrl, { username, password });
       if (response.status === 201 || response.status === 200) {
        return { success: true };
      } else {
        return { success: false, message: response.data?.msg || `Registration error` };
      }
    } catch (error) {
      // ... (error handling as before)
      return { success: false, message: error.response?.data?.msg || 'Registration failed server side' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setToken(null); // This will trigger the token-dependent useEffect to clear Axios header
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
