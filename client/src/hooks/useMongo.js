// client/src/hooks/useMongo.js
import axios from "axios";
import { useState, useEffect } from "react"; // MODIFIED: Removed unused useContext
import { useAuth } from "../contexts/AuthContext"; // MODIFIED: Removed unused AuthContext

const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";

// ... (rest of the file is unchanged, the full version is below for reference)
const getAuthHeaders = (token) => {
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export const fetchDataFromAPI = async (key, token) => {
  const targetUrl = `${API_URL_BASE}/${key}`;
  const headers = getAuthHeaders(token);
  console.log(`\n--- CLIENT useMongo: fetchDataFromAPI ---`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Attempting to GET: ${targetUrl}`);
  console.log(`Request HEADERS for ${key}: ${JSON.stringify(headers)}`);

  try {
    const response = await axios.get(targetUrl, { headers });
    console.log(`CLIENT useMongo: fetchDataFromAPI for ${key} SUCCEEDED. Status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`CLIENT useMongo: Error fetching ${key} from ${targetUrl}.`);
    if (error.response) {
      console.error(`Error Response Status: ${error.response.status}`);
      console.error(`Error Response Data: ${JSON.stringify(error.response.data)}`);
      if (error.response.status === 401) {
        console.error("--> fetchDataFromAPI received 401 Unauthorized from backend.");
      }
    } else if (error.request) {
      console.error("Error Request: No response received from server.", error.request);
    } else {
      console.error("Error Message (client-side issue before request was sent):", error.message);
    }
    console.log(`--- END CLIENT useMongo: fetchDataFromAPI (Error for ${key}) ---`);
    return null;
  }
};

export const postSingleItemToAPI = async (key, item, token) => {
  const targetUrl = `${API_URL_BASE}/${key}`;
  const headers = getAuthHeaders(token);
  console.log(`CLIENT useMongo: postSingleItemToAPI - Attempting to POST to ${targetUrl}`);
  console.log(`Request HEADERS for POST ${key}: ${JSON.stringify(headers)}`);
  try { 
    const response = await axios.post(targetUrl, item, { headers }); 
    return response.data; 
  } catch (error) { 
    console.error(`Error posting single ${key} to ${targetUrl}:`, error.response?.status, error.response?.data || error.message); 
    return null; 
  }
};

export const deleteItemFromAPI = async (key, itemId, token) => {
  const targetUrl = `${API_URL_BASE}/${key}/${itemId}`;
  const headers = getAuthHeaders(token);
  console.log(`CLIENT useMongo: deleteItemFromAPI - Attempting to DELETE from ${targetUrl}`);
  console.log(`Request HEADERS for DELETE ${key}: ${JSON.stringify(headers)}`);
  try { 
    const response = await axios.delete(targetUrl, { headers }); 
    return response.data; 
  } catch (error) { 
    console.error(`Error deleting ${key} ID ${itemId} from ${targetUrl}:`, error.response?.status, error.response?.data || error.message); 
    return null; 
  }
};

export const postMonthlyCapToAPI = async (capData, token) => {
  const targetUrl = `${API_URL_BASE}/monthlyCap`;
  const headers = getAuthHeaders(token);
  console.log(`CLIENT useMongo: postMonthlyCapToAPI - Attempting to POST to ${targetUrl}`);
  console.log(`Request HEADERS for POST monthlyCap: ${JSON.stringify(headers)}`);
  try { 
    const response = await axios.post(targetUrl, capData, { headers }); 
    return response.data; 
  } catch (error) { 
    console.error(`Error posting monthlyCap to ${targetUrl}:`, error.response?.status, error.response?.data || error.message); 
    return null; 
  }
};

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
    } else {
      setValue(initialDefault);
    }
  }, [key, isAuthenticated, authLoading, token, initialDefault]); // MODIFIED: Added initialDefault to dependency array
  
  return [value, setValue];
}
