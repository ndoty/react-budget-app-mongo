import React, { createContext, useContext, useEffect, useCallback } from "react";
import { Container } from "react-bootstrap";
import { v4 as uuidV4 } from "uuid";

import useMongo, {
  postSingleItemToAPI,
  deleteItemFromAPI,
  updateItemInAPI,
  fetchDataFromAPI,
} from "../hooks/useMongo";

import { useAuth } from "./AuthContext";

const EMPTY_ARRAY = [];

const BudgetsContext = createContext(undefined);

export function useBudgets() {
  const context = useContext(BudgetsContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetsProvider");
  }
  return context;
}

export const BudgetsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, token, logout: authLogout } = useAuth();

  const [budgets, setBudgets] = useMongo("budgets", EMPTY_ARRAY);
  const [expenses, setExpenses] = useMongo("expenses", EMPTY_ARRAY);
  const [income, setIncome] = useMongo("income", EMPTY_ARRAY);

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
      // MODIFIED: Changed WebSocket URL to leverage the working /api/ route
      const WS_URL = (process.env.REACT_APP_WS_URL || "wss://budget.technickservices.com/api/ws");
      console.log(`CLIENT LOG: Attempting to connect to WebSocket at ${WS_URL}`);
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('✅ CLIENT LOG: WebSocket connection opened successfully.');
        clearTimeout(reconnectTimeout);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('✅ CLIENT LOG: Received message from server:', message);
          
          const refetchData = async (key, setter) => {
            const data = await fetchDataFromAPI(key, token);
            if (data) setter(data);
          };

          switch (message.type) {
            case 'BUDGET_DATA_UPDATED':
              refetchData('budgets', setBudgets);
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
        console.log("CLIENT LOG: WebSocket disconnected. Reconnecting...");
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error("❌ CLIENT LOG: WebSocket error event fired.", error);
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
  }, [isAuthenticated, token, setBudgets, setExpenses, setIncome]);


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

  // ... (rest of the functions remain unchanged) ...
};
