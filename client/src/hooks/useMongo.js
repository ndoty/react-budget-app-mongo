// client/src/hooks/useMongo.js
import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"; // Ensure correct path

const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";

export const fetchDataFromAPI = async (key) => {
  const targetUrl = `${API_URL_BASE}/${key}`;
  // Log right before the call
  console.log(`CLIENT useMongo: fetchDataFromAPI - Attempting to GET ${targetUrl}`);
  console.log("CLIENT useMongo: Current Axios default headers right before GET:", JSON.stringify(axios.defaults.headers.common));

  try {
    const response = await axios.get(targetUrl);
    // console.log(`CLIENT useMongo: Data received for ${key}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`CLIENT useMongo: Error fetching ${key} from ${targetUrl}:`, error.response ? `${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message);
    if (error.response && error.response.status === 401) {
      console.error("CLIENT useMongo: fetchDataFromAPI received 401 Unauthorized. This means the token was missing, invalid, or expired when calling the backend.");
    }
    return null;
  }
};

// ... (postSingleItemToAPI, deleteItemFromAPI, postMonthlyCapToAPI - ensure they also log axios.defaults.headers.common before requests if needed)
export const postSingleItemToAPI = async (key, item) => {
  const targetUrl = `${API_URL_BASE}/${key}`;
  console.log(`CLIENT useMongo: postSingleItemToAPI - Attempting to POST to ${targetUrl}`);
  console.log("CLIENT useMongo: Current Axios default headers right before POST:", JSON.stringify(axios.defaults.headers.common));
  try {
    const response = await axios.post(targetUrl, item);
    return response.data;
  } catch (error) {
    console.error(`Error posting single ${key} to ${targetUrl}:`, error.response ? error.response.data : error.message);
    return null;
  }
};

export const deleteItemFromAPI = async (key, itemId) => {
  const targetUrl = `${API_URL_BASE}/${key}/${itemId}`;
  console.log(`CLIENT useMongo: deleteItemFromAPI - Attempting to DELETE from ${targetUrl}`);
  console.log("CLIENT useMongo: Current Axios default headers right before DELETE:", JSON.stringify(axios.defaults.headers.common));
  try {
    const response = await axios.delete(targetUrl);
    return response.data;
  } catch (error) {
    console.error(`Error deleting ${key} ID ${itemId} from ${targetUrl}:`, error.response ? error.response.data : error.message);
    return null;
  }
};

export const postMonthlyCapToAPI = async (capData) => {
  const targetUrl = `${API_URL_BASE}/monthlyCap`;
  console.log(`CLIENT useMongo: postMonthlyCapToAPI - Attempting to POST to ${targetUrl}`);
  console.log("CLIENT useMongo: Current Axios default headers right before POST:", JSON.stringify(axios.defaults.headers.common));
  try {
    const response = await axios.post(targetUrl, capData);
    return response.data;
  } catch (error) {
    console.error(`Error posting monthlyCap to ${targetUrl}:`, error.response ? error.response.data : error.message);
    return null;
  }
};


export default function useMongo(key, initialDefault = []) {
  const [value, setValue] = useState(initialDefault);
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // console.log(`useMongo HOOK (${key}): Effect triggered. AuthLoading: ${authLoading}, IsAuthenticated: ${isAuthenticated}`);

    const loadData = async () => {
      if (isAuthenticated) { // This should be true AFTER login and AuthContext updates
        // console.log(`useMongo HOOK (${key}): Authenticated & auth loaded. Fetching data...`);
        const data = await fetchDataFromAPI(key); // This is where the error for budgets (401) happens
        // console.log(`useMongo HOOK (${key}): Data fetched:`, data);
        setValue(Array.isArray(data) ? data : initialDefault);
      } else {
        // console.log(`useMongo HOOK (${key}): Not authenticated for data fetch. Setting to initialDefault.`);
        setValue(initialDefault);
      }
    };

    if (!authLoading) {
      // console.log(`useMongo HOOK (${key}): Auth loading complete. IsAuthenticated: ${isAuthenticated}. Running loadData.`);
      loadData();
    } else {
      // console.log(`useMongo HOOK (${key}): Auth is still loading. Setting value to initialDefault.`);
      setValue(initialDefault);
    }
  }, [key, isAuthenticated, authLoading]);

  return [value, setValue];
}
