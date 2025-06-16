import React, { createContext, useContext, useEffect, useCallback } from "react";
import { Container } from "react-bootstrap";
import { v4 as uuidV4 } from "uuid";
import axios from 'axios';

import useMongo, {
  postSingleItemToAPI,
  deleteItemFromAPI,
  updateItemInAPI,
  fetchDataFromAPI,
} from "../hooks/useMongo";

import { useAuth } from "./AuthContext";

const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget.technickservices.com/api";

const EMPTY_ARRAY = [];
const BudgetsContext = createContext(undefined);

export function useBudgets() {
  return useContext(BudgetsContext);
}

export const BudgetsProvider = ({ children }) => {
  const { isAuthenticated, token, logout: authLogout } = useAuth();

  const [budgets, setBudgets] = useMongo("budgets", EMPTY_ARRAY);
  const [expenses, setExpenses] = useMongo("expenses", EMPTY_ARRAY);
  const [income, setIncome] = useMongo("income", EMPTY_ARRAY);

  // ... (existing useEffects and helper functions)

  const exportData = async () => {
    try {
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${API_URL_BASE}/data/export`, { headers });
        
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `budget-backup-${new Date().toISOString().slice(0,10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        document.body.appendChild(linkElement); // Required for Firefox
        linkElement.click();
        document.body.removeChild(linkElement);
    } catch (error) {
        console.error("Failed to export data:", error);
        alert("Could not export your data. Please try again.");
    }
  };

  const importData = async (data) => {
    if (!window.confirm("Are you sure? This will permanently delete all your current data.")) {
        return;
    }
    try {
        const headers = { Authorization: `Bearer ${token}` };
        await axios.post(`${API_URL_BASE}/data/import`, data, { headers });
        
        // After import, force a refetch of all data to update the UI
        const budgetsData = await fetchDataFromAPI("budgets", token);
        const expensesData = await fetchDataFromAPI("expenses", token);
        const incomeData = await fetchDataFromAPI("income", token);
        setBudgets(budgetsData || []);
        setExpenses(expensesData || []);
        setIncome(incomeData || []);
    } catch (error) {
        console.error("Failed to import data:", error);
        throw new Error(error.response?.data?.msg || "Import failed on the server.");
    }
  };

  const value = {
    // ... (existing context values)
    exportData,
    importData,
  };

  return (
    <BudgetsContext.Provider value={value}>
      {children}
    </BudgetsContext.Provider>
  );
};
