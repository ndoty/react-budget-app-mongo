// client/src/contexts/BudgetsContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { Container, Modal, Button, Stack, Form } from "react-bootstrap"; // Assuming Modal was fixed
import { v4 as uuidV4 } from "uuid";

// CRITICAL IMPORT: Ensure this path is correct and useMongo is default exported
import useMongo, { 
  postSingleItemToAPI, 
  deleteItemFromAPI, 
  postMonthlyCapToAPI, 
  fetchDataFromAPI 
} from "../hooks/useMongo"; // Path relative to this file (src/contexts/useMongo.js)

import { useAuth } from "./AuthContext"; // Ensure correct path

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
  const { isAuthenticated, loading: authLoading, token } = useAuth();

  // These lines use useMongo. If 'useMongo is not defined', the import failed or is incorrect.
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
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token for addExpense"); return; }
    const newExpense = { id: uuidV4(), description, amount, budgetId };
    const savedExpense = await postSingleItemToAPI("expenses", newExpense, token);
    if (savedExpense) {
      setExpenses((prev) => [...(Array.isArray(prev) ? prev : []), savedExpense]);
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
      setBudgets((prev) => [...(Array.isArray(prev) ? prev : []), savedBudget]);
    } else { console.error("Failed to save budget"); }
  }

  async function deleteBudgetClient({ id }) {
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token for deleteBudget"); return; }
    const result = await deleteItemFromAPI("budgets", id, token);
    if (result) {
      setBudgets((prev) => Array.isArray(prev) ? prev.filter((b) => b.id !== id) : []);
      const updatedExpenses = await fetchDataFromAPI("expenses", token);
      if (updatedExpenses) setExpenses(updatedExpenses);
    } else { console.error("Failed to delete budget"); }
  }

  async function deleteExpenseClient({ id }) {
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token for deleteExpense"); return; }
    const result = await deleteItemFromAPI("expenses", id, token);
    if (result) {
      setExpenses((prev) => Array.isArray(prev) ? prev.filter((exp) => exp.id !== id) : []);
    } else { console.error("Failed to delete expense"); }
  }

  async function setMonthlyCapTotal(capAmountStr) {
    if (!isAuthenticated || !token) { console.error("User not authenticated/no token for setMonthlyCap"); return; }
    const amount = parseFloat(capAmountStr);
    let capDataPayload = {};
    if (!isNaN(amount) && amount > 0) capDataPayload = { cap: amount };
    const result = await postMonthlyCapToAPI(capDataPayload, token);
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
