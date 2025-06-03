// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
// If you use Container for a global AuthProvider loader, import it.
// import { Container } from "react-bootstrap"; 

const API_URL = process.env.REACT_APP_API_URL || "//localhost:5000/api";

// Define a default shape for the context value.
// This helps if a component somehow tries to use the context
// without a Provider, though that's not the issue here.
const defaultAuthContextValue = {
  token: null,
  currentUser: null,
  isAuthenticated: false,
  loading: true, // Start as true
  login: async () => { throw new Error("Login function not yet available"); },
  register: async () => { throw new Error("Register function not yet available"); },
  logout: () => { throw new Error("Logout function not yet available"); },
};

const AuthContext = createContext(defaultAuthContextValue);

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('currentUser');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Error parsing stored user:", e);
      return null;
    }
  });
  // This 'internalLoading' state is for AuthProvider's own asynchronous setup.
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    // console.log("AuthProvider: Running initialization useEffect.");
    const storedToken = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('currentUser');

    if (storedToken) {
      setToken(storedToken); // This will trigger the axios header update
      if (storedUserString) {
        try {
          const parsedUser = JSON.parse(storedUserString);
          setCurrentUser(parsedUser);
        } catch (e) {
          console.error("Error parsing stored currentUser on init:", e);
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null); // No stored user
      }
    } else {
      // No token, ensure user is null
      setCurrentUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
    setInternalLoading(false); // Crucial: Mark initialization as complete
    // console.log("AuthProvider: Initialization complete. internalLoading set to false.");
  }, []); // Empty dependency array: runs once on mount

  useEffect(() => {
    // This effect solely manages the Axios default header based on the token state
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
      setToken(res.data.token); // This updates the token state
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
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setToken(null); // This will trigger the header removal via useEffect
    setCurrentUser(null);
  };

  const contextValue = {
    token,
    currentUser,
    isAuthenticated: !!token,
    loading: internalLoading, // This 'loading' is what consumers will use
    login,
    register,
    logout,
  };
  
  // The AuthProvider always renders its children, wrapped in the Provider.
  // The contextValue.loading will inform consumers if auth is still initializing.
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
