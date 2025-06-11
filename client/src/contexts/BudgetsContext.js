import React, { createContext, useContext, useEffect } from "react";
import { Container } from "react-bootstrap";
import { v4 as uuidV4 } from "uuid";
import axios from "axios";

import useMongo, {
  postSingleItemToAPI,
  deleteItemFromAPI,
  fetchDataFromAPI
  // MODIFIED: Removed unused postMonthlyCapToAPI
} from "../hooks/useMongo";
import { useAuth } from "./AuthContext";

const BudgetsContext = createContext(undefined);
const API_URL_BASE = process.env.REACT_APP_API_URL || "https://budget-api.technickservices.com/api";

export const UNCATEGORIZED_BUDGET_ID = "Uncategorized";

const defaultBudgets = [];
const defaultExpenses = [];
const defaultIncome = [];

export function useBudgets() {
  const context = useContext(BudgetsContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetsProvider");
  }
  return context;
}

export const BudgetsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, token } = useAuth();
  const [budgets, setBudgets] = useMongo("budgets", defaultBudgets);
  const [expenses, setExpenses] = useMongo("expenses", defaultExpenses);
  const [income, setIncome] = useMongo("income", defaultIncome);
  // MODIFIED: Removed monthlyCap state
  // const [monthlyCap, setMonthlyCap] = useMongo("monthlyCap", defaultMonthlyCap);

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
        const incomeData = await fetchDataFromAPI("income", token);
        setIncome(Array.isArray(incomeData) ? incomeData : []);
        // MODIFIED: Removed monthlyCap fetch
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type && (message.type.includes('_UPDATED'))) {
          refetchAllData();
        }
      } catch (e) {}
    };

    return () => {
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
    };
  }, [isAuthenticated, token, authLoading, setBudgets, setExpenses, setIncome]); // MODIFIED: Removed setMonthlyCap

  function getBudgetExpenses(budgetId) { return Array.isArray(expenses) ? expenses.filter((expense) => expense.budgetId === budgetId) : []; }
  function getBudget(id) { return Array.isArray(budgets) ? budgets.find(b => b.id === id) : undefined; }
  function getExpense(id) { return Array.isArray(expenses) ? expenses.find(e => e.id === id) : undefined; }
  function getIncomeItem(id) { return Array.isArray(income) ? income.find(i => i.id === id) : undefined; }
  
  async function addExpense({ description, amount, budgetId }) { await postSingleItemToAPI("expenses", { id: uuidV4(), description, amount, budgetId }, token); }
  async function addBudget({ name, max }) { if (Array.isArray(budgets) && budgets.find((b) => b.name === name)) { return alert("Budget with this name already exists."); } await postSingleItemToAPI("budgets", { id: uuidV4(), name, max }, token); }
  async function deleteBudget({ id }) { await deleteItemFromAPI("budgets", id, token); }
  async function deleteExpense({ id }) { await deleteItemFromAPI("expenses", id, token); }
  async function updateBudget({ id, ...updates }) { if (!id) return; try { await axios.put(`${API_URL_BASE}/budgets/${id}`, updates, { headers: { Authorization: `Bearer ${token}` } }); } catch (error) { console.error("Failed to update budget:", error); } }
  async function updateExpense({ id, ...updates }) { if (!id) return; try { await axios.put(`${API_URL_BASE}/expenses/${id}`, updates, { headers: { Authorization: `Bearer ${token}` } }); } catch (error) { console.error("Failed to update expense:", error); } }
  
  async function addIncome({ description, amount }) { await postSingleItemToAPI("income", { id: uuidV4(), description, amount }, token); }
  async function deleteIncome({ id }) { await deleteItemFromAPI("income", id, token); }
  async function updateIncome({ id, ...updates }) { if (!id) return; try { await axios.put(`${API_URL_BASE}/income/${id}`, updates, { headers: { Authorization: `Bearer ${token}` } }); } catch (error) { console.error("Failed to update income:", error); } }
  // MODIFIED: Removed setMonthlyCapTotal function

  if (authLoading) {
    return <Container className="my-4"><p>Loading User Data...</p></Container>;
  }

  return (
    <BudgetsContext.Provider
      value={{
        budgets,
        expenses,
        income,
        // MODIFIED: Removed monthlyCap
        getBudgetExpenses,
        getBudget,
        getExpense,
        getIncomeItem,
        addExpense,
        addBudget,
        deleteBudget,
        deleteExpense,
        updateBudget,
        updateExpense,
        addIncome,
        deleteIncome,
        updateIncome,
        // MODIFIED: Removed setMonthlyCapTotal
      }}
    >
      {children}
    </BudgetsContext.Provider>
  );
};
