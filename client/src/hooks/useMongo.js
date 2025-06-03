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
    // console.log(`useMongo (${key}) - Effect triggered. authLoading: ${authLoading}, isAuthenticated: ${isAuthenticated}`);
    const loadData = async () => {
      if (isAuthenticated) {
        // console.log(`useMongo (${key}): Auth ready and authenticated, fetching data.`);
        const data = await fetchDataFromAPI(key);
        setValue(Array.isArray(data) ? data : initialDefault); 
      } else {
        // console.log(`useMongo (${key}): Not authenticated. Setting to initialDefault.`);
        setValue(initialDefault);
      }
    };

    if (!authLoading) {
      // console.log(`useMongo (${key}): Auth loading complete. Proceeding with loadData logic.`);
      loadData();
    } else {
      // console.log(`useMongo (${key}): Auth is still loading. Setting to initialDefault to avoid stale data.`);
       setValue(initialDefault); // Ensure data is cleared/reset if auth is loading
    }
  }, [key, isAuthenticated, authLoading]); // initialDefault removed as it might cause loops if it's a new array/object ref each render

  return [value, setValue];
}
