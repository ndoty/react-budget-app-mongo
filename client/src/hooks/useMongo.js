// client/src/hooks/useMongo.js
import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";

export const fetchDataFromAPI = async (key) => {
  const targetUrl = `${API_URL_BASE}/${key}`;
  console.log(`CLIENT useMongo: fetchDataFromAPI - Attempting to GET from ${targetUrl}`);
  console.log("CLIENT useMongo: Current Axios default headers:", JSON.stringify(axios.defaults.headers.common)); // Log headers
  try {
    const response = await axios.get(targetUrl); // Token should be in headers via AuthContext
    return response.data;
  } catch (error) {
    console.error(`CLIENT useMongo: Error fetching ${key} from ${targetUrl}:`, error.response ? error.response.data : error.message);
    if (error.response && error.response.status === 401) {
      // The error message "{msg: 'No token, authorization denied'}" comes from the backend if this happens.
      console.error("CLIENT useMongo: fetchDataFromAPI received 401 Unauthorized. Token was likely missing or invalid.");
    }
    return null; // This will lead to BudgetsContext setting empty data
  }
};

// ... (postSingleItemToAPI, deleteItemFromAPI, postMonthlyCapToAPI should also use the default header) ...
export const postSingleItemToAPI = async (key, item) => {
  const targetUrl = `${API_URL_BASE}/${key}`;
  console.log(`CLIENT useMongo: postSingleItemToAPI - Attempting to POST to ${targetUrl}`);
  console.log("CLIENT useMongo: Current Axios default headers:", JSON.stringify(axios.defaults.headers.common));
  try { /* ... */ } catch (error) { /* ... */ }
};
// Add similar logging to other API functions if the error occurs there.


export default function useMongo(key, initialDefault = []) {
  const [value, setValue] = useState(initialDefault);
  const { isAuthenticated, loading: authLoading } = useAuth(); // This comes from AuthContext

  useEffect(() => {
    // console.log(`useMongo HOOK (${key}): Effect triggered. AuthLoading: ${authLoading}, IsAuthenticated: ${isAuthenticated}`);

    const loadData = async () => {
      if (isAuthenticated) { // This should be true after login
        // console.log(`useMongo HOOK (${key}): Authenticated & auth loaded. Fetching data...`);
        const data = await fetchDataFromAPI(key); // This is where the error likely occurs
        // console.log(`useMongo HOOK (${key}): Data fetched:`, data);
        setValue(Array.isArray(data) ? data : initialDefault);
      } else {
        // console.log(`useMongo HOOK (${key}): Not authenticated. Setting to initialDefault.`);
        setValue(initialDefault);
      }
    };

    if (!authLoading) { // When AuthContext says it's no longer loading
      // console.log(`useMongo HOOK (${key}): Auth loading complete. IsAuthenticated: ${isAuthenticated}. Running loadData.`);
      loadData();
    } else {
      // console.log(`useMongo HOOK (${key}): Auth is still loading. Setting value to initialDefault.`);
      setValue(initialDefault);
    }
  }, [key, isAuthenticated, authLoading]); // Dependencies are correct

  return [value, setValue];
}
