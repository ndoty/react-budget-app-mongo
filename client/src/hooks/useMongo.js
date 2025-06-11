// client/src/hooks/useMongo.js
import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";

const getAuthHeaders = (token) => {
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export const fetchDataFromAPI = async (key, token) => {
  const targetUrl = `${API_URL_BASE}/${key}`;
  const headers = getAuthHeaders(token);
  try {
    const response = await axios.get(targetUrl, { headers });
    return response.data;
  } catch (error) {
    console.error(`CLIENT: Error fetching ${key}:`, error.response?.data?.msg || error.message);
    return null;
  }
};

export const postSingleItemToAPI = async (key, item, token) => {
  const targetUrl = `${API_URL_BASE}/${key}`;
  const headers = getAuthHeaders(token);
  try { 
    const response = await axios.post(targetUrl, item, { headers }); 
    return response.data; 
  } catch (error) { 
    console.error(`CLIENT: Error posting ${key}:`, error.response?.data?.msg || error.message);
    return null; 
  }
};

export const deleteItemFromAPI = async (key, itemId, token) => {
  const targetUrl = `${API_URL_BASE}/${key}/${itemId}`;
  const headers = getAuthHeaders(token);
  try { 
    const response = await axios.delete(targetUrl, { headers }); 
    return response.data; 
  } catch (error) { 
    console.error(`CLIENT: Error deleting ${key} ID ${itemId}:`, error.response?.data?.msg || error.message);
    return null; 
  }
};

// MODIFIED: Removed postMonthlyCapToAPI function

export default function useMongo(key, initialDefault = []) {
  const [value, setValue] = useState(initialDefault);
  const { isAuthenticated, loading: authLoading, token } = useAuth(); 

  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated && token) {
        const data = await fetchDataFromAPI(key, token); 
        setValue(Array.isArray(data) ? data : initialDefault);
      } else {
        setValue(initialDefault);
      }
    };

    if (!authLoading) {
      loadData();
    }
  }, [key, isAuthenticated, authLoading, token, initialDefault]);
  
  return [value, setValue];
}
