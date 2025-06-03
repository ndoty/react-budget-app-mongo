import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const API_URL_BASE = process.env.REACT_APP_API_URL || "//localhost:5000/api";

export const fetchDataFromAPI = async (key) => {
  try {
    const response = await axios.get(`${API_URL_BASE}/${key}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${key}:`, error.response ? error.response.data : error.message);
    if (error.response && error.response.status === 401) {
      console.error("fetchDataFromAPI: Unauthorized fetch.");
      // Consider calling logout() from AuthContext if a global logout on 401 is desired.
      // Example: auth.logout(); // but auth would need to be passed or context used here.
    }
    return null;
  }
};

export const postSingleItemToAPI = async (key, item) => {
  try {
    const response = await axios.post(`${API_URL_BASE}/${key}`, item);
    return response.data;
  } catch (error) {
    console.error(`Error posting single ${key}:`, error.response ? error.response.data : error.message);
    return null;
  }
};

export const deleteItemFromAPI = async (key, itemId) => {
  try {
    const response = await axios.delete(`${API_URL_BASE}/${key}/${itemId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting ${key} ID ${itemId}:`, error.response ? error.response.data : error.message);
    return null;
  }
};

export const postMonthlyCapToAPI = async (capData) => {
  try {
    const response = await axios.post(`${API_URL_BASE}/monthlyCap`, capData);
    return response.data;
  } catch (error) {
    console.error(`Error posting monthlyCap:`, error.response ? error.response.data : error.message);
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
        setValue(Array.isArray(data) ? data : initialDefault); // Ensure data is array or fallback
      } else {
        setValue(initialDefault); // Clear data if not authenticated
      }
    };

    if (!authLoading) {
      loadData();
    } else {
      setValue(initialDefault); // Also clear/reset if auth is still loading
    }
    // initialDefault is an array, so it's stable unless its reference changes.
    // If initialDefault could change reference frequently and cause loops, consider a more specific dependency.
  }, [key, isAuthenticated, authLoading]); // Removed initialDefault from deps for now

  return [value, setValue];
}
