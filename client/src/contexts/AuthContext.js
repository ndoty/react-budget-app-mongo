// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from "react-bootstrap";

const API_URL = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";
// console.log("AuthContext: API_URL is set to:", API_URL);

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
  const [token, setToken] = useState(null); // Initialized to null
  const [currentUser, setCurrentUser] = useState(null);
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    // console.log("AuthProvider: Mount & Initial Effect - Start");
    const storedToken = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('currentUser');

    if (storedToken) {
      // console.log("AuthProvider: Token found in localStorage, setting token state:", storedToken);
      setToken(storedToken); // This should trigger the other useEffect for Axios headers
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
      // console.log("AuthProvider: No token found in localStorage.");
      setCurrentUser(null);
      delete axios.defaults.headers.common['Authorization']; // Ensure header is clear if no token
    }
    setInternalLoading(false);
  }, []);

  // THIS useEffect IS CRITICAL FOR SETTING THE TOKEN IN AXIOS HEADERS
  useEffect(() => {
    if (token) {
      console.log("AuthContext useEffect[token]: Token is PRESENT, setting Axios default header.", token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      console.log("AuthContext useEffect[token]: Token is ABSENT, deleting Axios default header.");
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]); // This effect runs WHENEVER the `token` state changes

  const login = async (username, password) => {
    const
