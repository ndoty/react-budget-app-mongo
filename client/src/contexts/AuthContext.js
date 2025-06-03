import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'; // Renamed from Axios for consistency

const API_URL = process.env.REACT_APP_API_URL || "//localhost:5000/api"; // Fallback for local dev

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser'); // Store user object
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
      // Optionally: Add a request here to verify token with backend and fetch fresh user data
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('currentUser', JSON.stringify({ id: res.data.userId, username: res.data.username })); // Store user
      setToken(res.data.token);
      setCurrentUser({ id: res.data.userId, username: res.data.username });
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      return { success: true };
    } catch (error) {
      console.error("Login error", error.response ? error.response.data : error.message);
      return { success: false, message: error.response?.data?.msg || 'Login failed' };
    }
  };

  const register = async (username, password) => {
    try {
      // Registration typically doesn't log the user in automatically,
      // but if it does and returns a token:
      await axios.post(`${API_URL}/auth/register`, { username, password });
      // Or, handle token if backend sends it upon registration and log them in:
      // const res = await axios.post(`${API_URL}/auth/register`, { username, password });
      // localStorage.setItem('token', res.data.token);
      // setToken(res.data.token);
      // axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      return { success: true };
    } catch (error) {
      console.error("Registration error", error.response ? error.response.data : error.message);
      return { success: false, message: error.response?.data?.msg || 'Registration failed' };
    }
  };


  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setToken(null);
    setCurrentUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    token,
    currentUser,
    isAuthenticated: !!token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
