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

// MODIFIED: Restored the 'export' keyword
export function useBudgets() {
  const context = useContext(BudgetsContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetsProvider");
  }
  return context;
}

export const UNCATEGORIZED_BUDGET_ID = "Uncategorized";
export const BILLS_BUDGET_ID = "Bills";

export const BudgetsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, token, logout: authLogout } = useAuth();

  const [budgets, setBudgets] = useMongo("budgets", EMPTY_ARRAY);
  const [expenses, setExpenses] = useMongo("expenses", EMPTY_ARRAY);
  const [income, setIncome] = useMongo("income", EMPTY_ARRAY);

  // Use the real logout function from AuthContext
  const logout = authLogout;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setBudgets(EMPTY_ARRAY);
      setExpenses(EMPTY_ARRAY);
      setIncome(EMPTY_ARRAY);
    }
  }, [isAuthenticated, authLoading, setBudgets, setExpenses, setIncome]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    let ws;
    let reconnectTimeout;

    function connect() {
      // This uses the correct WebSocket URL that was previously working
      const WS_URL = "wss://budget.technickservices.com/api/ws";
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("CLIENT WebSocket: Connected to server.");
        clearTimeout(reconnectTimeout);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const refetchData = async (key, setter) => {
            const data = await fetchDataFromAPI(key, token);
            if (data) setter(data);
          };

          switch (message.type) {
            case 'BUDGET_DATA_UPDATED':
              refetchData('budgets', setBudgets);
              refetchData('expenses', setExpenses);
              refetchData('income', setIncome);
              break;
            case 'EXPENSE_DATA_UPDATED':
              refetchData('expenses', setExpenses);
              break;
            case 'INCOME_DATA_UPDATED':
              refetchData('income', setIncome);
              break;
            default:
              break;
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("CLIENT WebSocket: Disconnected. Attempting to reconnect in 3 seconds.");
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error("CLIENT WebSocket: Error:", error);
        ws.close();
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [isAuthenticated, token]);


  function getBudgetExpenses(budgetId) {
    return Array.isArray(expenses)
      ? expenses.filter((expense) => expense.budgetId === budgetId)
      : [];
  }
  
  function getBillExpenses() {
    return Array.isArray(expenses)
      ? expenses.filter((expense) => expense.isBill)
      : [];
  }
    
  function getIncomeItem(incomeId) {
    return Array.isArray(income) ? income.find((i) => i.id === incomeId) : undefined;
  }
    
  function getBudget(budgetId) {
      return Array.isArray(budgets) ? budgets.find((b) => b.id === budgetId) : undefined;
  }
  
  function getExpense(expenseId) {
    return Array.isArray(expenses) ? expenses.find(e => e.id === expenseId) : undefined;
  }

  async function addExpense({ description, amount, budgetId, isBill, dueDate }) {
    if (!isAuthenticated || !token) return;
    const newExpense = { id: uuidV4(), description, amount, budgetId, isBill, dueDate };
    await postSingleItemToAPI("expenses", newExpense, token);
  }
  
  async function addIncome({ description, amount }) {
    if (!isAuthenticated || !token) return;
    const newIncome = { id: uuidV4(), description, amount };
    await postSingleItemToAPI("income", newIncome, token);
  }

  async function addBudget({ name, max }) {
    if (!isAuthenticated || !token) return;
    if (Array.isArray(budgets) && budgets.find((b) => b.name === name)) {
      alert("Budget with this name already exists.");
      return;
    }
    const newBudget = { id: uuidV4(), name, max };
    await postSingleItemToAPI("budgets", newBudget, token);
  }

  async function deleteBudget({ id }) {
    if (!isAuthenticated || !token) return;
    await deleteItemFromAPI("budgets", id, token);
  }
    
  async function deleteIncome({ id }) {
    if (!isAuthenticated || !token) return;
    await deleteItemFromAPI("income", id, token);
  }

  async function deleteExpense({ id }) {
    if (!isAuthenticated || !token) return;
    await deleteItemFromAPI("expenses", id, token);
  }
  
  async function updateBudget({ id, ...updates }) {
    if (!isAuthenticated || !token) return;
    await updateItemInAPI("budgets", id, updates, token);
  }
  
  async function updateExpense({ id, ...updates }) {
    if (!isAuthenticated || !token) return;
    await updateItemInAPI("expenses", id, updates, token);
  }
  
  async function updateIncome({ id, ...updates }) {
    if (!isAuthenticated || !token) return;
    await updateItemInAPI("income", id, updates, token);
  }

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
        document.body.appendChild(linkElement);
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
        
        // MODIFIED: After a successful import, manually refetch all data to update the UI.
        // The WebSocket will update other open clients.
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


  if (authLoading) {
    return <Container className="my-4" style={{ textAlign: 'center' }}><p>Loading User Data...</p></Container>;
  }

  return (
    <BudgetsContext.Provider
      value={{
        budgets,
        expenses,
        income,
        getBudgetExpenses,
        getBillExpenses,
        getIncomeItem,
        getBudget,
        getExpense,
        addExpense,
        addIncome,
        addBudget,
        deleteBudget,
        deleteIncome,
        deleteExpense,
        updateBudget,
        updateExpense,
        updateIncome,
        logout,
        exportData,
        importData,
        UNCATEGORIZED_BUDGET_ID,
        BILLS_BUDGET_ID,
      }}
    >
      {children}
    </BudgetsContext.Provider>
  );
};
