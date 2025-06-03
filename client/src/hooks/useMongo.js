import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"; // Ensure correct path

const API_URL_BASE = process.env.REACT_APP_API_URL || "//localhost:5000/api";

export const fetchDataFromAPI = async (key) => {
  try {
    // console.log(`fetchDataFromAPI: Fetching ${key}`);
    const response = await axios.get(`${API_URL_BASE}/${key}`);
    // console.log(`fetchDataFromAPI: Received for ${key}`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${key}:`, error.response ? error.response.data : error.message);
    if (error.response && error.response.status === 401) {
      console.error("fetchDataFromAPI: Unauthorized fetch.");
      // Potentially trigger logout via AuthContext or an event
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
        setValue(data || initialDefault);
      } else {
        // console.log(`useMongo (${key}): Not authenticated or auth still loading. Setting to initialDefault.`);
        setValue(initialDefault);
      }
    };

    if (!authLoading) { // Only fetch if auth state determination is complete
      // console.log(`useMongo (${key}): Auth loading complete. Proceeding with loadData logic.`);
      loadData();
    } else {
      // console.log(`useMongo (${key}): Auth is still loading. Deferring fetch.`);
      // Ensure data is reset if auth is loading, to avoid showing stale data from a previous session briefly
       setValue(initialDefault);
    }
  }, [key, isAuthenticated, authLoading]); // Removed initialDefault from deps to avoid potential loops if it's a new array/object each render

  return [value, setValue];
}
