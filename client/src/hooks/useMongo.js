// client/src/hooks/useMongo.js
import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";

export const fetchDataFromAPI = async (key) => {
  const targetUrl = `${API_URL_BASE}/${key}`;
  console.log(`\n--- CLIENT useMongo: fetchDataFromAPI ---`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Attempting to GET: ${targetUrl}`);
  // CRITICAL LOG: What are the default headers right before this specific call?
  console.log(`Axios default headers at call time: ${JSON.stringify(axios.defaults.headers.common, null, 2)}`);

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
        console.error("--> fetchDataFromAPI received 401 Unauthorized. This means the token was missing, invalid, or expired when the backend processed the request.");
      }
    } else if (error.request) {
      console.error("Error Request: No response received from server.", error.request);
    } else {
      console.error("Error Message:", error.message);
    }
    console.log(`--- END CLIENT useMongo: fetchDataFromAPI (Error) ---`);
    return null;
  }
};

// Make sure postSingleItemToAPI, deleteItemFromAPI, postMonthlyCapToAPI also log headers if issues persist there
// For brevity, I'll assume they follow the same pattern of logging headers before the call if needed.

export const postSingleItemToAPI = async (key, item) => {
  const targetUrl = `${API_URL_BASE}/${key}`;
  console.log(`CLIENT useMongo: postSingleItemToAPI - Attempting to POST to ${targetUrl}`);
  console.log("CLIENT useMongo: Current Axios default headers right before POST:", JSON.stringify(axios.defaults.headers.common));
  try { const response = await axios.post(targetUrl, item); return response.data; }
  catch (error) { console.error(`Error posting single ${key} to ${targetUrl}:`, error.response?.data || error.message); return null; }
};
export const deleteItemFromAPI = async (key, itemId) => {
  const targetUrl = `${API_URL_BASE}/${key}/${itemId}`;
  console.log(`CLIENT useMongo: deleteItemFromAPI - Attempting to DELETE from ${targetUrl}`);
  console.log("CLIENT useMongo: Current Axios default headers right before DELETE:", JSON.stringify(axios.defaults.headers.common));
  try { const response = await axios.delete(targetUrl); return response.data; }
  catch (error) { console.error(`Error deleting ${key} ID ${itemId} from ${targetUrl}:`, error.response?.data || error.message); return null; }
};
export const postMonthlyCapToAPI = async (capData) => {
  const targetUrl = `${API_URL_BASE}/monthlyCap`;
  console.log(`CLIENT useMongo: postMonthlyCapToAPI - Attempting to POST to ${targetUrl}`);
  console.log("CLIENT useMongo: Current Axios default headers right before POST:", JSON.stringify(axios.defaults.headers.common));
  try { const response = await axios.post(targetUrl, capData); return response.data; }
  catch (error) { console.error(`Error posting monthlyCap to ${targetUrl}:`, error.response?.data || error.message); return null; }
};


export default function useMongo(key, initialDefault = []) {
  const [value, setValue] = useState(initialDefault);
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // console.log(`useMongo HOOK (${key}): Effect. AuthLoading: ${authLoading}, IsAuthenticated: ${isAuthenticated}`);
    const loadData = async () => {
      if (isAuthenticated) {
        await fetchDataFromAPI(key).then(data => {
            setValue(Array.isArray(data) ? data : initialDefault);
        });
      } else {
        setValue(initialDefault);
      }
    };

    if (!authLoading) {
      loadData();
    } else {
      setValue(initialDefault);
    }
  }, [key, isAuthenticated, authLoading]);

  return [value, setValue];
}
