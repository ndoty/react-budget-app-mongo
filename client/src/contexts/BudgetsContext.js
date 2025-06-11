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

  // WebSocket connection logic
  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const WS_URL = process.env.REACT_APP_WS_URL || "wss://budget-api.technickservices.com/ws";
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("CLIENT WebSocket: Connected to server.");
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
            console.log("Unknown update type:", message.type);
            break;
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("CLIENT WebSocket: Disconnected from server.");
    };

    ws.onerror = (error) => {
      console.error("CLIENT WebSocket: Error:", error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
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

  // --- MODIFIED DATA FUNCTIONS ---
  // All functions now only make the API call. The local state update
  // is handled by the WebSocket listener for all clients simultaneously.

  async function addExpense({ description, amount, budgetId, isBill }) {
    if (!isAuthenticated || !token) return;
    const newExpense = { id: uuidV4(), description, amount, budgetId, isBill };
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
