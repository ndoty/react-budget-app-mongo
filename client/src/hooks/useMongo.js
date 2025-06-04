// client/src/hooks/useMongo.js
import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"; // Ensure correct path

const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";

export const fetchDataFromAPI = async (key) => {
  const targetUrl = `${API_URL_BASE}/${key}`;
  console.log(`\n--- CLIENT useMongo: fetchDataFromAPI ---`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Attempting to GET: ${targetUrl}`);
  
  // CRITICAL LOG: What are the Axios default headers right before this specific call?
  console.log(`Axios default headers at call time (fetchDataFromAPI for ${key}): ${JSON.stringify(axios.defaults.headers.common, null, 2)}`);

  try {
    const response = await axios.get(targetUrl); // Token should be in defaults
    console.log(`CLIENT useMongo: fetchDataFromAPI for ${key} SUCCEEDED. Status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`CLIENT useMongo: Error fetching ${key} from ${targetUrl}.`);
    if (error.response) {
      console.error(`Error Response Status: ${error.response.status}`);
      console.error(`Error Response Data: ${JSON.stringify(error.response.data)}`);
      if (error.response.status === 401) {
        console.error("--> fetchDataFromAPI received 401 Unauthorized from backend. This implies the backend's authMiddleware did not find/validate a token in the request it received.");
      }
    } else if (error.request) {
      console.error("Error Request: No response received from server. Is the backend reachable and not crashing?", error.request);
    } else {
      console.error("Error Message (client-side issue before request was sent):", error.message);
    }
    console.log(`--- END CLIENT useMongo: fetchDataFromAPI (Error for ${key}) ---`);
    return null;
  }
};

// Ensure other API calling functions also have similar logging if issues persist there
export const postSingleItemToAPI = async (key, item) => {
  const targetUrl = `${API_URL_BASE}/${key}`;
  console.log(`CLIENT useMongo: postSingleItemToAPI - Attempting to POST to ${targetUrl}`);
  console.log("CLIENT useMongo: Current Axios default headers right before POST:", JSON.stringify(axios.defaults.headers.common));
  try { 
    const response = await axios.post(targetUrl, item); 
    return response.data; 
  } catch (error) { 
    console.error(`Error posting single ${key} to ${targetUrl}:`, error.response?.status, error.response?.data || error.message); 
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
    console.error(`Error deleting ${key} ID ${itemId} from ${targetUrl}:`, error.response?.status, error.response?.data || error.message); 
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
    console.error(`Error posting monthlyCap to ${targetUrl}:`, error.response?.status, error.response?.data || error.message); 
    return null; 
  }
};


export default function useMongo(key, initialDefault = []) {
  const [value, setValue] = useState(initialDefault);
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // console.log(`useMongo HOOK (${key}): Effect. AuthLoading: ${authLoading}, IsAuthenticated: ${isAuthenticated}`);
    const loadData = async () => {
      if (isAuthenticated) {
        // console.log(`useMongo HOOK (${key}): Authenticated. Fetching data...`);
        const data = await fetchDataFromAPI(key);
        setValue(Array.isArray(data) ? data : initialDefault);
      } else {
        // console.log(`useMongo HOOK (${key}): Not Authenticated. Clearing data.`);
        setValue(initialDefault);
      }
    };

    if (!authLoading) { // Only when auth state is resolved
      // console.log(`useMongo HOOK (${key}): Auth ready. IsAuthenticated: ${isAuthenticated}. Running loadData.`);
      loadData();
    } else {
      // console.log(`useMongo HOOK (${key}): Auth still loading. Clearing data.`);
      setValue(initialDefault); 
    }
  }, [key, isAuthenticated, authLoading]);

  return [value, setValue];
}
