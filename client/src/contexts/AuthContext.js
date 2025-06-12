import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import useLocalStorage from "../hooks/useLocalStorage";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useLocalStorage("token", null);
  const [currentUser, setCurrentUser] = useLocalStorage("user", null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = token != null;

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL_BASE}/auth/login`, { username, password });
      if (response.data.token) {
        setToken(response.data.token);
        setCurrentUser({ username });
        return { success: true };
      }
      return { success: false, message: "Login failed. Please try again."};
    } catch (error) {
      return { success: false, message: error.response?.data?.msg || "Login failed." };
    }
  };

  const register = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL_BASE}/auth/register`, { username, password });
      if (response.status === 201) {
        return { success: true, message: response.data.msg };
      }
      return { success: false, message: "Registration failed."};
    } catch (error) {
      return { success: false, message: error.response?.data?.msg || "Registration failed." };
    }
  };
  
  // MODIFIED: Wrapped logout in useCallback to ensure it has a stable reference
  const logout = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
    // This will effectively log the user out and redirect them via the ProtectedRoute component
  }, [setToken, setCurrentUser]);

  useEffect(() => {
    setLoading(false);
  }, []);

  // MODIFIED: Added a useEffect to handle expired tokens globally
  useEffect(() => {
    // This is an Axios interceptor. It runs a function on every API response.
    const responseInterceptor = axios.interceptors.response.use(
      // If the response is successful (e.g., status 200), just pass it through.
      response => response,
      // If the response has an error...
      error => {
        // Check if the error is an authentication error (401 Unauthorized or 403 Forbidden)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.error("Authentication error detected. Logging out.");
          // If the token is expired or invalid, call the logout function.
          logout();
        }
        // Be sure to return the error, so other parts of the app can handle it if needed.
        return Promise.reject(error);
      }
    );

    // This is a cleanup function that runs when the component unmounts.
    // It removes the interceptor to prevent memory leaks.
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);


  const value = {
    token,
    currentUser,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
