// client/src/hooks/useMongo.js
import axios from "axios";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

// Updated API_URL_BASE definition
const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";
// Add a log here too:
console.log("useMongo: Initial API_URL_BASE value:", API_URL_BASE);
console.log("useMongo: process.env.REACT_APP_API_URL value:", process.env.REACT_APP_API_URL);

// ... (fetchDataFromAPI, postSingleItemToAPI, deleteItemFromAPI, postMonthlyCapToAPI functions as provided before,
// ensure they use `${API_URL_BASE}/...` correctly)

export const fetchDataFromAPI = async (key) => {
  const targetUrl = `${API_URL_BASE}/${key}`;
  // console.log(`fetchDataFromAPI: Fetching ${targetUrl}`);
  try { /* ... */ } catch (error) { /* ... */ }
};
// Apply similar logging to other API functions if needed.

export default function useMongo(key, initialDefault = []) {
  // ... (rest of the hook as previously provided) ...
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
  }, [key, isAuthenticated, authLoading]);

  return [value, setValue];
}
