import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from "react-bootstrap"; 

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
      return { success: false, message: error.response?.data?.msg || 'Login failed. Check credentials or server status.' };
    }
  };

  const register = async (username, password) => {
    console.log(`Attempting registration for ${username} at ${API_URL}/auth/register`);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { username, password });
       if (response.status === 201 || response.status === 200) {
        console.log("Registration API call successful:", response.data);
        return { success: true };
      } else {
        console.warn("Registration API call returned non-2xx status:", response.status, response.data);
        return { success: false, message: response.data?.msg || `Registration failed with status ${response.status}` };
      }
    } catch (error) {
      let message = 'Registration failed. Please try again.';
      if (error.response) {
        console.error("Registration API error (client):", error.response.data, "Status:", error.response.status);
        message = error.response.data.msg || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error("Registration network error (client): No response received.", error.request);
        message = 'Network error or server is not responding. Ensure backend is running and API_URL is correct.';
      } else {
        console.error('Registration setup error (client):', error.message);
        message = `Client-side error: ${error.message}`;
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
    return <Container className="my-4" style={{textAlign: 'center'}}><p>Initializing Authentication...</p></Container>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
