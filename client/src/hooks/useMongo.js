import axios from "axios"; // Using lowercase axios for consistency
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"; // To re-fetch on auth change

const API_URL_BASE = process.env.REACT_APP_API_URL || "//localhost:5000/api";

export const fetchDataFromAPI = async (key) => {
  try {
    const response = await axios.get(`${API_URL_BASE}/${key}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${key}:`, error.response ? error.response.data : error);
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized fetch. Token might be invalid or missing.");
      // AuthContext should ideally handle global logout on 401
    }
    return null;
  }
};

export const postSingleItemToAPI = async (key, item) => {
  try {
    const response = await axios.post(`${API_URL_BASE}/${key}`, item);
    return response.data;
  } catch (error) {
    console.error(`Error posting single ${key}:`, error.response ? error.response.data : error);
    return null;
  }
};

export const deleteItemFromAPI = async (key, itemId) => {
  try {
    const response = await axios.delete(`${API_URL_BASE}/${key}/${itemId}`); // Using client-generated ID
    return response.data;
  } catch (error) {
    console.error(`Error deleting ${key} ID ${itemId}:`, error.response ? error.response.data : error);
    return null;
  }
};

// Special function for posting monthly cap (which has a slightly different structure on backend)
export const postMonthlyCapToAPI = async (capData) => {
  try {
    // Backend expects { cap: number } or {} to clear.
    const response = await axios.post(`${API_URL_BASE}/monthlyCap`, capData);
    return response.data;
  } catch (error) {
    console.error(`Error posting monthlyCap:`, error.response ? error.response.data : error);
    return null;
  }
}

export default function useMongo(key, initialDefault = []) {
  const [value, setValue] = useState(initialDefault);
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        const data = await fetchDataFromAPI(key);
        setValue(data || initialDefault);
      } else {
        setValue(initialDefault); // Clear data if not authenticated
      }
    };

    if (!authLoading) { // Only fetch if auth state is resolved
        loadData();
    }
  }, [key, isAuthenticated, authLoading, initialDefault]); // Re-fetch if key or auth state changes

  return [value, setValue];
}
