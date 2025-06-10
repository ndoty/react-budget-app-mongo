// client/src/contexts/BudgetsContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { v4 as uuidV4 } from "uuid";
import axios from "axios"; // MODIFIED: Import axios for update functions

import useMongo, {
  postSingleItemToAPI,
  deleteItemFromAPI,
  postMonthlyCapToAPI,
  fetchDataFromAPI
} from "../hooks/useMongo";
import { useAuth } from "./AuthContext";

const BudgetsContext = createContext(undefined);
const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";

export const UNCATEGORIZED_BUDGET_ID = "Uncategorized";

export function useBudgets() {
  const context = useContext(BudgetsContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetsProvider");
  }
  return context;
}

export const BudgetsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, token } = useAuth();

  const [budgets, setBudgets] = useMongo("budgets", []);
  const [expenses, setExpenses] = useMongo("expenses", []);
  const [monthlyCap, setMonthlyCap] = useMongo("monthlyCap", []);

  useEffect(() => {
    if (!isAuthenticated || !token || authLoading) return;
    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    let wsHost;
    const apiUrl = process.env.REACT_APP_API_URL;
    if (apiUrl && apiUrl.startsWith('http')) {
      try {
        const urlObject = new URL(apiUrl);
        wsHost = urlObject.host;
      } catch (e) {
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
    let socket;
    try {
        socket = new WebSocket(wsUrl);
    } catch (error) {
        console.error("BudgetsContext WebSocket Error:", error);
        return;
    }
    const refetchAllData = async () => {
      if (isAuthenticated && token) {
        const budgetsData = await fetchDataFromAPI("budgets", token);
        setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
        const expensesData = await fetchDataFromAPI("expenses", token);
        setExpenses(Array.isArray(expensesData) ? expensesData : []);
        const capData = await fetchDataFromAPI("monthlyCap", token);
        setMonthlyCap(Array.isArray(capData) ? capData : []);
      }
    };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type && message.type.includes('_UPDATED')) {
          refetchAllData();
        }
      } catch (e) {}
    };
    return () => {
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
    };
  }, [isAuthenticated, token, authLoading, setBudgets, setExpenses, setMonthlyCap]);

  function getBudgetExpenses(budgetId) {
    return Array.isArray(expenses) ? expenses.filter((expense) => expense.budgetId === budgetId) : [];
  }
  
  // MODIFIED: Add getBudget and getExpense functions
  function getBudget(id) {
    return Array.isArray(budgets) ? budgets.find(b => b.id === id) : undefined;
  }
  function getExpense(id) {
    return Array.isArray(expenses) ? expenses.find(e => e.id === id) : undefined;
  }

  async function addExpense({ description, amount, budgetId }) {
    const newExpense = { id: uuidV4(), description, amount, budgetId };
    await postSingleItemToAPI("expenses", newExpense, token);
  }

  async function addBudget({ name, max }) {
    if (Array.isArray(budgets) && budgets.find((b) => b.name === name)) {
      return alert("Budget with this name already exists.");
    }
    const newBudget = { id: uuidV4(), name, max };
    await postSingleItemToAPI("budgets", newBudget, token);
  }

  async function deleteBudget({ id }) {
    await deleteItemFromAPI("budgets", id, token);
  }

  async function deleteExpense({ id }) {
    await deleteItemFromAPI("expenses", id, token);
  }
  
  // MODIFIED: Add updateBudget and updateExpense functions
  async function updateBudget({ id, ...updates }) {
    if (!id) return;
    try {
      await axios.put(`${API_URL_BASE}/budgets/${id}`, updates, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      console.error("Failed to update budget:", error);
    }
  }

  async function updateExpense({ id, ...updates }) {
    if (!id) return;
    try {
      await axios.put(`${API_URL_BASE}/expenses/${id}`, updates, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      console.error("Failed to update expense:", error);
    }
  }

  async function setMonthlyCapTotal(capAmountStr) {
    const amount = parseFloat(capAmountStr);
    let capDataPayload = {};
    if (!isNaN(amount) && amount >= 0) capDataPayload = { cap: amount };
    else { return console.error("Invalid cap amount:", capAmountStr); }
    await postMonthlyCapToAPI(capDataPayload, token);
  }

  if (authLoading) {
    return <Container className="my-4"><p>Loading User Data...</p></Container>;
  }

  return (
    <BudgetsContext.Provider
      value={{
        budgets, expenses, monthlyCap,
        getBudgetExpenses, getBudget, getExpense, // Added getBudget and getExpense
        addExpense, addBudget,
        deleteBudget, deleteExpense,
        updateBudget, updateExpense, // Added updateBudget and updateExpense
        setMonthlyCapTotal,
      }}
    >
      {children}
    </BudgetsContext.Provider>
  );
};