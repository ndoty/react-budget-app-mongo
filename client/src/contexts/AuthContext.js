import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import useLocalStorage from "../hooks/useLocalStorage";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget.technickservices.com/api";

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
        setCurrentUser(response.data.user);
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
  
  const logout = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
  }, [setToken, setCurrentUser]);

  const changePassword = async (currentPassword, newPassword) => {
      try {
          const headers = { Authorization: `Bearer ${token}` };
          const response = await axios.post(`${API_URL_BASE}/auth/change-password`, 
              { currentPassword, newPassword },
              { headers }
          );
          return { success: true, message: response.data.msg };
      } catch (error) {
          return { success: false, message: error.response?.data?.msg || "Password update failed." };
      }
  };

  // Function to delete the user's account
  const deleteAccount = async (password) => {
      try {
          const headers = { Authorization: `Bearer ${token}` };
          const response = await axios.post(`${API_URL_BASE}/auth/delete-account`,
              { password },
              { headers }
          );
          // On successful deletion, log the user out
          logout();
          return { success: true, message: response.data.msg };
      } catch (error) {
          return { success: false, message: error.response?.data?.msg || "Account deletion failed." };
      }
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          logout();
        }
        return Promise.reject(error);
      }
    );

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
    changePassword,
    deleteAccount, // Expose the new function
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
