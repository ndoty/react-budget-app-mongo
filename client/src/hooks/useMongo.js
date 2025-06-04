import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";

export const fetchDataFromAPI = async (key) => {
  try {
    const targetUrl = `${API_URL_BASE}/${key}`;
    // console.log(`CLIENT useMongo: fetchDataFromAPI for ${targetUrl}`);
    const response = await axios.get(targetUrl); // Token is automatically included by AuthContext
    // console.log(`CLIENT useMongo: Data received for ${key}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`CLIENT useMongo: Error fetching ${key} from ${API_URL_BASE}/${key}:`, error.response ? error.response.data : error.message);
    if (error.response && error.response.status === 401) {
      console.error("CLIENT useMongo: Unauthorized fetch. Token might be invalid.");
      // Potentially trigger logout if 401 on data fetch
    }
    return null;
  }
};

// postSingleItemToAPI, deleteItemFromAPI, postMonthlyCapToAPI as previously defined, they use API_URL_BASE

export const postSingleItemToAPI = async (key, item) => {
  try {
    const targetUrl = `${API_URL_BASE}/${key}`;
    const response = await axios.post(targetUrl, item);
    return response.data;
  } catch (error) {
    console.error(`Error posting single ${key} to ${targetUrl}:`, error.response ? error.response.data : error.message);
    return null;
  }
};

export const deleteItemFromAPI = async (key, itemId) => {
  try {
    const targetUrl = `${API_URL_BASE}/${key}/${itemId}`;
    const response = await axios.delete(targetUrl);
    return response.data;
  } catch (error) {
    console.error(`Error deleting ${key} ID ${itemId} from ${targetUrl}:`, error.response ? error.response.data : error.message);
    return null;
  }
};

export const postMonthlyCapToAPI = async (capData) => {
  try {
    const targetUrl = `${API_URL_BASE}/monthlyCap`;
    const response = await axios.post(targetUrl, capData);
    return response.data;
  } catch (error) {
    console.error(`Error posting monthlyCap to ${targetUrl}:`, error.response ? error.response.data : error.message);
    return null;
  }
}


export default function useMongo(key, initialDefault = []) {
  const [value, setValue] = useState(initialDefault);
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // console.log(`useMongo HOOK (${key}): Effect triggered. AuthLoading: ${authLoading}, IsAuthenticated: ${isAuthenticated}`);

    const loadData = async () => {
      if (isAuthenticated) {
        // console.log(`useMongo HOOK (${key}): Authenticated & auth loaded. Fetching data...`);
        const data = await fetchDataFromAPI(key);
        // console.log(`useMongo HOOK (${key}): Data fetched:`, data);
        setValue(Array.isArray(data) ? data : initialDefault);
      } else {
        // console.log(`useMongo HOOK (${key}): Not authenticated or auth still loading. Setting to initialDefault.`);
        setValue(initialDefault); // Clear data if not authenticated
      }
    };

    if (!authLoading) { // Only run loadData if authentication status is resolved
      // console.log(`useMongo HOOK (${key}): Auth loading finished. IsAuthenticated: ${isAuthenticated}.`);
      loadData();
    } else {
      // console.log(`useMongo HOOK (${key}): Auth still loading. Setting to initialDefault to avoid stale data.`);
      setValue(initialDefault); // Reset if auth is re-evaluating
    }
  // Key, isAuthenticated, and authLoading are the correct dependencies here.
  // initialDefault should not be in deps if it's a new array/object literal each time.
  }, [key, isAuthenticated, authLoading]);

  return [value, setValue];
}
