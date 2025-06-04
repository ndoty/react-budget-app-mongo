// client/src/contexts/BudgetsContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { Container, Modal, Button, Stack, Form } from "react-bootstrap";
import { v4 as uuidV4 } from "uuid";
// Import API functions from useMongo.js - they now expect a token argument
import { fetchDataFromAPI, postSingleItemToAPI, deleteItemFromAPI, postMonthlyCapToAPI } from "../hooks/useMongo";
import { useAuth } from "./AuthContext"; // To get the token

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
  const { isAuthenticated, loading: authLoading, token } = useAuth(); // Get token here

  // useMongo hook itself now uses the token from AuthContext for its initial fetch
  const [budgets, setBudgets] = useMongo("budgets", []);
  const [expenses, setExpenses] = useMongo("expenses", []);
  const [monthlyCap, setMonthlyCap] = useMongo("monthlyCap", []);

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
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token"); return; }
    const newExpense = { id: uuidV4(), description, amount, budgetId };
    const savedExpense = await postSingleItemToAPI("expenses", newExpense, token); // Pass token
    if (savedExpense) {
      setExpenses((prev) => [...(Array.isArray(prev) ? prev : []), savedExpense]);
    } else { console.error("Failed to save expense"); }
  }

  async function addBudget({ name, max }) {
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token"); return; }
    if (Array.isArray(budgets) && budgets.find((b) => b.name === name)) {
      alert("Budget with this name already exists."); return;
    }
    const newBudget = { id: uuidV4(), name, max };
    const savedBudget = await postSingleItemToAPI("budgets", newBudget, token); // Pass token
    if (savedBudget) {
      setBudgets((prev) => [...(Array.isArray(prev) ? prev : []), savedBudget]);
    } else { console.error("Failed to save budget"); }
  }

  async function deleteBudgetClient({ id }) {
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token"); return; }
    const result = await deleteItemFromAPI("budgets", id, token); // Pass token
    if (result) {
      setBudgets((prev) => Array.isArray(prev) ? prev.filter((b) => b.id !== id) : []);
      const updatedExpenses = await fetchDataFromAPI("expenses", token); // Pass token for refetch
      if (updatedExpenses) setExpenses(updatedExpenses);
    } else { console.error("Failed to delete budget"); }
  }

  async function deleteExpenseClient({ id }) {
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token"); return; }
    const result = await deleteItemFromAPI("expenses", id, token); // Pass token
    if (result) {
      setExpenses((prev) => Array.isArray(prev) ? prev.filter((exp) => exp.id !== id) : []);
    } else { console.error("Failed to delete expense"); }
  }

  async function setMonthlyCapTotal(capAmountStr) {
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token"); return; }
    const amount = parseFloat(capAmountStr);
    let capDataPayload = {};
    if (!isNaN(amount) && amount > 0) capDataPayload = { cap: amount };
    const result = await postMonthlyCapToAPI(capDataPayload, token); // Pass token
    if (result) {
      setMonthlyCap(result);
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
