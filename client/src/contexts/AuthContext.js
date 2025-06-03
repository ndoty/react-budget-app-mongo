import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from "react-bootstrap"; // For AuthProvider's own loading UI

// Ensure your .env file in the `client` folder has this (e.g., REACT_APP_API_URL=http://localhost:5000/api)
const API_URL = process.env.REACT_APP_API_URL || "//localhost:5000/api";

const defaultAuthContextValue = {
  token: null,
  currentUser: null,
  isAuthenticated: false,
  loading: true, // Consumers will see this as true initially
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
  const [internalLoading, setInternalLoading] = useState(true); // AuthProvider's own setup loading

  useEffect(() => {
    console.log("AuthProvider: Mount & Initial Effect - Start");
    const storedToken = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('currentUser');

    if (storedToken) {
      console.log("AuthProvider: Token found in localStorage.");
      setToken(storedToken); // This will trigger the separate useEffect for Axios headers
      if (storedUserString) {
        try {
          const parsedUser = JSON.parse(storedUserString);
          setCurrentUser(parsedUser);
          console.log("AuthProvider: User found in localStorage.", parsedUser);
        } catch (e) {
          console.error("AuthProvider: Error parsing stored currentUser", e);
          localStorage.removeItem('currentUser'); // Clear corrupted data
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null); // No stored user if string is null/undefined
      }
    } else {
      console.log("AuthProvider: No token found in localStorage.");
      setCurrentUser(null); // Ensure user is null if no token
      delete axios.defaults.headers.common['Authorization']; // Explicitly clear if no token initially
    }

    console.log("AuthProvider: Initial Effect - Setting internalLoading to false.");
    setInternalLoading(false); // Mark AuthProvider's setup as complete
  }, []); // Empty dependency array: runs only once on mount

  useEffect(() => {
    // This effect solely manages the Axios default header based on the token state
    if (token) {
      // console.log("AuthProvider: Token state updated, setting Axios header.");
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      // console.log("AuthProvider: Token state is null/cleared, deleting Axios header.");
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]); // Runs when token changes

  const login = async (username, password) => {
    try {
      console.log(`AuthProvider: Logging in user ${username} at ${API_URL}/auth/login`);
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
    try {
      console.log(`AuthProvider: Registering user ${username} at ${API_URL}/auth/register`);
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
    loading: internalLoading, // This 'loading' is what consumers will get
    login,
    register,
    logout,
  };

  // AuthProvider renders its children ONLY when its internalLoading is false.
  if (internalLoading) {
    // console.log("AuthProvider: Is loading (internalLoading is true). Showing init message.");
    return <Container className="my-4" style={{textAlign: 'center'}}><p>Initializing Authentication...</p></Container>;
  }

  // console.log("AuthProvider: internalLoading is false. Rendering Provider. Context loading state will be:", contextValue.loading);
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
