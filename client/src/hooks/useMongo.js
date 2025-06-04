import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";
// Log to ensure the .env variable is picked up, or the fallback is used.
// console.log("useMongo: API_URL_BASE is set to:", API_URL_BASE);
// if (!process.env.REACT_APP_API_URL) {
//   console.warn("useMongo: REACT_APP_API_URL is not set in .env, using fallback:", API_URL_BASE);
// }


export const fetchDataFromAPI = async (key) => {
  try {
    const targetUrl = `${API_URL_BASE}/${key}`;
    const response = await axios.get(targetUrl);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${key} from ${API_URL_BASE}/${key}:`, error.response ? error.response.data : error.message);
    if (error.response && error.response.status === 401) {
      console.error("fetchDataFromAPI: Unauthorized fetch.");
    }
    return null;
  }
};

export const postSingleItemToAPI = async (key, item) => {
  try {
    const targetUrl = `${API_URL_BASE}/${key}`;
    const response = await axios.post(targetUrl, item);
    return response.data;
  } catch (error) {
    console.error(`Error posting single ${key} to ${API_URL_BASE}/${key}:`, error.response ? error.response.data : error.message);
    return null;
  }
};

export const deleteItemFromAPI = async (key, itemId) => {
  try {
    const targetUrl = `${API_URL_BASE}/${key}/${itemId}`;
    const response = await axios.delete(targetUrl);
    return response.data;
  } catch (error) {
    console.error(`Error deleting ${key} ID ${itemId} from ${API_URL_BASE}/${key}/${itemId}:`, error.response ? error.response.data : error.message);
    return null;
  }
};

export const postMonthlyCapToAPI = async (capData) => {
  try {
    const targetUrl = `${API_URL_BASE}/monthlyCap`;
    const response = await axios.post(targetUrl, capData);
    return response.data;
  } catch (error) {
    console.error(`Error posting monthlyCap to ${API_URL_BASE}/monthlyCap:`, error.response ? error.response.data : error.message);
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
  }, [key, isAuthenticated, authLoading]); // initialDefault removed from deps

  return [value, setValue];
}
