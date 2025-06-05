// client/src/contexts/BudgetsContext.js
import React, { createContext, useContext, useEffect, useState } from "react"; // Added useEffect
import { Container } from "react-bootstrap"; // Removed Modal, Button, Stack, Form as they are not used here
import { v4 as uuidV4 } from "uuid";

import useMongo, {
  postSingleItemToAPI,
  deleteItemFromAPI,
  postMonthlyCapToAPI,
  fetchDataFromAPI
} from "../hooks/useMongo";
import { useAuth } from "./AuthContext";

const BudgetsContext = createContext(undefined);

export const UNCATEGORIZED_BUDGET_ID = "Uncategorized";

export function useBudgets() {
  const context = useContext(BudgetsContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetsProvider");
  }
  return context;
}

export const BudgetsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, token, currentUser } = useAuth(); // Added currentUser for logging

  const [budgets, setBudgets] = useMongo("budgets", []);
  const [expenses, setExpenses] = useMongo("expenses", []);
  const [monthlyCap, setMonthlyCap] = useMongo("monthlyCap", []);

  // --- START WebSocket Logic for BudgetsContext ---
  useEffect(() => {
    if (!isAuthenticated || !token || authLoading) {
      return; // Don't connect if not authenticated or auth is still loading
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    let wsHost;
    const apiUrl = process.env.REACT_APP_API_URL;

    if (apiUrl && apiUrl.startsWith('http')) {
      try {
        const urlObject = new URL(apiUrl);
        wsHost = urlObject.host;
      } catch (e) {
        console.error("BudgetsContext WebSocket: Invalid REACT_APP_API_URL, falling back.", e);
        wsHost = process.env.NODE_ENV === 'production'
                       ? 'budget-api.technickservices.com'
                       : `localhost:${process.env.REACT_APP_SERVER_PORT || 5000}`;
      }
    } else if (process.env.NODE_ENV === 'production') {
        wsHost = 'budget-api.technickservices.com';
    } else {
        wsHost = `localhost:${process.env.REACT_APP_SERVER_PORT || 5000}`;
    }
    const wsUrl = `${wsProtocol}${wsHost}/ws`;

    console.log(`BudgetsContext WebSocket: Attempting to connect to ${wsUrl} for user: ${currentUser?.username}`);
    let socket;
    try {
        socket = new WebSocket(wsUrl);
    } catch (error) {
        console.error("BudgetsContext WebSocket: Error initializing WebSocket:", error);
        return;
    }


    const refetchAllData = async () => {
      console.log("BudgetsContext WebSocket: Refetching all data due to server update.");
      if (isAuthenticated && token) {
        const budgetsData = await fetchDataFromAPI("budgets", token);
        setBudgets(Array.isArray(budgetsData) ? budgetsData : []);

        const expensesData = await fetchDataFromAPI("expenses", token);
        setExpenses(Array.isArray(expensesData) ? expensesData : []);

        const capData = await fetchDataFromAPI("monthlyCap", token);
        setMonthlyCap(Array.isArray(capData) ? capData : []);
      }
    };

    socket.onopen = () => {
      console.log("BudgetsContext WebSocket: Connected to server");
    };

    socket.onmessage = (event) => {
      console.log(`BudgetsContext WebSocket: Message from server: `, event.data);
      try {
        const message = JSON.parse(event.data);
        // Listen for generic data update signals or specific ones
        if (message.type === 'BUDGET_DATA_UPDATED' ||
            message.type === 'EXPENSE_DATA_UPDATED' ||
            message.type === 'MONTHLY_CAP_UPDATED' ||
            message.type === 'DATA_REFRESH_REQUESTED') { // A generic type
          refetchAllData();
        }
      } catch (e) {
        // console.log("BudgetsContext WebSocket: Received non-JSON message or parse error", event.data);
      }
    };

    socket.onerror = (error) => {
      console.error("BudgetsContext WebSocket: Error:", error);
    };

    socket.onclose = (event) => {
      if (event.wasClean) {
        console.log(`BudgetsContext WebSocket: Connection closed cleanly, code=${event.code} reason=${event.reason}`);
      } else {
        console.error(`BudgetsContext WebSocket: Connection died. Code: ${event.code}`);
      }
    };

    // Cleanup on component unmount or when auth state changes
    return () => {
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        console.log("BudgetsContext WebSocket: Closing connection");
        socket.close(1000, "BudgetsContext unmounting or auth change");
      }
    };
  }, [isAuthenticated, token, authLoading, currentUser?.username, setBudgets, setExpenses, setMonthlyCap]); // Added dependencies
  // --- END WebSocket Logic for BudgetsContext ---


  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setBudgets([]);
      setExpenses([]);
      setMonthlyCap([]);
    }
  }, [isAuthenticated, authLoading, setBudgets, setExpenses, setMonthlyCap]);

  function getBudgetExpenses(budgetId) {
    return Array.isArray(expenses) ? expenses.filter((expense) => expense.budgetId === budgetId) : [];
  }

  async function addExpense({ description, amount, budgetId }) {
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token for addExpense"); return; }
    const newExpense = { id: uuidV4(), description, amount, budgetId };
    const savedExpense = await postSingleItemToAPI("expenses", newExpense, token);
    if (savedExpense) {
      // Data will be refetched via WebSocket broadcast from server
      // setExpenses((prev) => [...(Array.isArray(prev) ? prev : []), savedExpense]);
    } else { console.error("Failed to save expense"); }
  }

  async function addBudget({ name, max }) {
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token for addBudget"); return; }
    if (Array.isArray(budgets) && budgets.find((b) => b.name === name)) {
      alert("Budget with this name already exists."); return;
    }
    const newBudget = { id: uuidV4(), name, max };
    const savedBudget = await postSingleItemToAPI("budgets", newBudget, token);
    if (savedBudget) {
      // Data will be refetched via WebSocket broadcast from server
      // setBudgets((prev) => [...(Array.isArray(prev) ? prev : []), savedBudget]);
    } else { console.error("Failed to save budget"); }
  }

  async function deleteBudgetClient({ id }) {
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token for deleteBudget"); return; }
    const result = await deleteItemFromAPI("budgets", id, token);
    if (result) {
      // Data will be refetched via WebSocket broadcast from server
      // setBudgets((prev) => Array.isArray(prev) ? prev.filter((b) => b.id !== id) : []);
      // const updatedExpenses = await fetchDataFromAPI("expenses", token);
      // if (updatedExpenses) setExpenses(updatedExpenses);
    } else { console.error("Failed to delete budget"); }
  }

  async function deleteExpenseClient({ id }) {
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token for deleteExpense"); return; }
    const result = await deleteItemFromAPI("expenses", id, token);
    if (result) {
      // Data will be refetched via WebSocket broadcast from server
      // setExpenses((prev) => Array.isArray(prev) ? prev.filter((exp) => exp.id !== id) : []);
    } else { console.error("Failed to delete expense"); }
  }

  async function setMonthlyCapTotal(capAmountStr) {
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token for setMonthlyCap"); return; }
    const amount = parseFloat(capAmountStr);
    let capDataPayload = {};
    if (!isNaN(amount) && amount >= 0) capDataPayload = { cap: amount }; // Allow 0 for cap
    else { console.error("Invalid cap amount for API:", capAmountStr); return; }

    const result = await postMonthlyCapToAPI(capDataPayload, token);
    if (result) {
      // Data will be refetched via WebSocket broadcast from server
      // setMonthlyCap(result);
    } else { console.error("Failed to set monthly cap"); }
  }

  if (authLoading) {
    return <Container className="my-4" style={{ textAlign: 'center' }}><p>Loading User Data (waiting for auth)...</p></Container>;
  }

  return (
    <BudgetsContext.Provider
      value={{
        budgets, expenses, monthlyCap,
        getBudgetExpenses, addExpense, addBudget,
        deleteBudget: deleteBudgetClient,
        deleteExpense: deleteExpenseClient,
        setMonthlyCapTotal,
      }}
    >
      {children}
    </BudgetsContext.Provider>
  );
};
