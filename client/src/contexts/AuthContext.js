// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from "react-bootstrap";

// This line reads from your client/.env file at build/start time
const API_URL = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";
// The fallback "https://budget-api.technickservices.com/api" is used if REACT_APP_API_URL is undefined.

// Add a log here to see what API_URL is when the module loads:
console.log("AuthContext: Initial API_URL value:", API_URL);
console.log("AuthContext: process.env.REACT_APP_API_URL value:", process.env.REACT_APP_API_URL);


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
  // ... (useState and useEffects as previously provided) ...
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    // This console log inside useEffect is also good to confirm at runtime
    console.log("AuthProvider Mounted: Using API_URL:", API_URL);
    const storedToken = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('currentUser');

    if (storedToken) {
      setToken(storedToken);
      if (storedUserString) {
        try { setCurrentUser(JSON.parse(storedUserString)); }
        catch (e) { localStorage.removeItem('currentUser'); setCurrentUser(null); }
      } else { setCurrentUser(null); }
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


  const register = async (username, password) => {
    const targetUrl = `${API_URL}/auth/register`; // e.g., https://budget-api.technickservices.com/api/auth/register
    // Critical Log: Check this in your browser console when you attempt registration
    console.log(`CLIENT: Attempting to POST to REGISTER target URL: ${targetUrl}`);
    try {
      const response = await axios.post(targetUrl, { username, password });
      // ... (rest of the logic)
      if (response.status === 201 || response.status === 200) {
        return { success: true };
      } else {
        return { success: false, message: response.data?.msg || `Registration failed with status ${response.status}` };
      }
    } catch (error) {
      let message = 'Registration failed. Please try again.';
      if (error.response) {
        message = error.response.data.msg || `Server error: ${error.response.status}`;
      } else if (error.request) {
        message = `Network error or server not responding at ${targetUrl}.`;
      } else {
        message = `Client-side error: ${error.message}`;
      }
      console.error("CLIENT: Registration actual error object:", error); // Log the full error
      return { success: false, message };
    }
  };

  // ... (login and logout functions, contextValue, and return statement as previously provided) ...
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
    return <Container className="my-4" style={{textAlign: 'center'}}><p>Initializing Authentication...</p></Container>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
