import React, { createContext, useContext, useEffect } from "react";
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

export const UNCATEGORIZED_BUDGET_ID = "Uncategorized";
export const BILLS_BUDGET_ID = "Bills";

export function useBudgets() {
  const context = useContext(BudgetsContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetsProvider");
  }
  return context;
}

export const BudgetsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, token } = useAuth();

  const [budgets, setBudgets] = useMongo("budgets", EMPTY_ARRAY);
  const [expenses, setExpenses] = useMongo("expenses", EMPTY_ARRAY);
  const [income, setIncome] = useMongo("income", EMPTY_ARRAY);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setBudgets(EMPTY_ARRAY);
      setExpenses(EMPTY_ARRAY);
      setIncome(EMPTY_ARRAY);
    }
  }, [isAuthenticated, authLoading, setBudgets, setExpenses, setIncome]);

  // MODIFIED: Added robust WebSocket connection logic with reconnection
  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    let ws;
    let reconnectTimeout;

    function connect() {
      const WS_URL = process.env.REACT_APP_WS_URL || "wss://budget-api.technickservices.com/ws";
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("CLIENT WebSocket: Connected to server.");
        clearTimeout(reconnectTimeout);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("CLIENT WebSocket: Update received -> ", message.type);

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
        console.log("CLIENT WebSocket: Disconnected. Attempting to reconnect in 3 seconds.");
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => {
            connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error("CLIENT WebSocket: Error:", error);
        ws.close(); // This triggers the onclose handler for reconnection
      };
    }

    connect(); // Initial connection

    // Cleanup on component unmount or logout
    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; // Prevent reconnection logic from firing on manual close
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

  async function addExpense({ description, amount, budgetId, isBill, dueDate }) {
    if (!isAuthenticated || !token) return;
    const newExpense = { id: uuidV4(), description, amount, budgetId, isBill, dueDate };
    const savedExpense = await postSingleItemToAPI("expenses", newExpense, token);
    if (savedExpense) {
      setExpenses(prev => [...prev, savedExpense]);
    }
  }
  
  async function addIncome({ description, amount }) {
    if (!isAuthenticated || !token) return;
    const newIncome = { id: uuidV4(), description, amount };
    const savedIncome = await postSingleItemToAPI("income", newIncome, token);
    if (savedIncome) {
      setIncome(prev => [...prev, savedIncome]);
    }
  }

  async function addBudget({ name, max }) {
    if (!isAuthenticated || !token) return;
    if (Array.isArray(budgets) && budgets.find((b) => b.name === name)) {
      alert("Budget with this name already exists.");
      return;
    }
    const newBudget = { id: uuidV4(), name, max };
    const savedBudget = await postSingleItemToAPI("budgets", newBudget, token);
    if (savedBudget) {
      setBudgets(prev => [...prev, savedBudget]);
    }
  }

  async function deleteBudget({ id }) {
    if (!isAuthenticated || !token) return;
    const result = await deleteItemFromAPI("budgets", id, token);
    if (result) {
      const updatedExpenses = await fetchDataFromAPI("expenses", token);
      if (updatedExpenses) setExpenses(updatedExpenses);
      setBudgets(prev => prev.filter(b => b.id !== id));
    }
  }
    
  async function deleteIncome({ id }) {
    if (!isAuthenticated || !token) return;
    const result = await deleteItemFromAPI("income", id, token);
    if (result) {
      setIncome(prev => prev.filter(i => i.id !== id));
    }
  }

  async function deleteExpense({ id }) {
    if (!isAuthenticated || !token) return;
    const result = await deleteItemFromAPI("expenses", id, token);
    if (result) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  }
  
  async function updateBudget({ id, ...updates }) {
    if (!isAuthenticated || !token) return;
    const updatedBudget = await updateItemInAPI("budgets", id, updates, token);
    if (updatedBudget) {
      setBudgets(prev => prev.map(b => b.id === id ? updatedBudget : b));
    }
  }
  
  async function updateExpense({ id, ...updates }) {
    if (!isAuthenticated || !token) return;
    const updatedExpense = await updateItemInAPI("expenses", id, updates, token);
    if (updatedExpense) {
      setExpenses(prev => prev.map(e => e.id === id ? updatedExpense : e));
    }
  }
  
  async function updateIncome({ id, ...updates }) {
    if (!isAuthenticated || !token) return;
    const updatedIncome = await updateItemInAPI("income", id, updates, token);
    if (updatedIncome) {
      setIncome(prev => prev.map(i => i.id === id ? updatedIncome : i));
    }
  }

  if (authLoading) {
    return <Container className="my-4" style={{ textAlign: 'center' }}><p>Loading User Data (waiting for auth)...</p></Container>;
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
        UNCATEGORIZED_BUDGET_ID,
      }}
    >
      {children}
    </BudgetsContext.Provider>
  );
};
