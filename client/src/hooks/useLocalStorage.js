import { useState, useEffect } from "react";

const PREFIX = "react-budget-app-mongo-";

export default function useLocalStorage(key, initialValue) {
  const prefixedKey = PREFIX + key;

  const [value, setValue] = useState(() => {
    // Prevent errors during server-side rendering
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const jsonValue = localStorage.getItem(prefixedKey);
      // If a value exists in localStorage, parse it.
      // If not, return the initial default value.
      return jsonValue != null ? JSON.parse(jsonValue) : initialValue;
    } catch (error) {
      // If there's an error parsing the stored value (e.g., old data format),
      // log the error, remove the corrupted item, and fall back to the initial value.
      console.error(`Error parsing localStorage key "${prefixedKey}":`, error);
      localStorage.removeItem(prefixedKey);
      return initialValue;
    }
  });

  useEffect(() => {
    // Prevent errors during server-side rendering
    if (typeof window !== 'undefined') {
      try {
        // When the value is null or undefined, remove it from localStorage
        // to keep it clean. Otherwise, store the JSON stringified value.
        if (value === undefined || value === null) {
          localStorage.removeItem(prefixedKey);
        } else {
          localStorage.setItem(prefixedKey, JSON.stringify(value));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${prefixedKey}":`, error);
      }
    }
  }, [prefixedKey, value]);

  return [value, setValue];
}
