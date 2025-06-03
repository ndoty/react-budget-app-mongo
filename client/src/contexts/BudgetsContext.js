import React, { createContext, useContext, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { v4 as uuidV4 } from "uuid";
import useMongo, { postSingleItemToAPI, deleteItemFromAPI, postMonthlyCapToAPI, fetchDataFromAPI } from "../hooks/useMongo"; // Ensure path is correct
import { useAuth } from "./AuthContext"; // Ensure path is correct

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
  const { isAuthenticated, loading: authLoading } = useAuth();

  // console.log("BudgetsProvider - Render - authLoading:", authLoading, "isAuthenticated:", isAuthenticated);

  const [budgets, setBudgets] = useMongo("budgets", []);
  const [expenses, setExpenses] = useMongo("expenses", []);
  const [monthlyCap, setMonthlyCap] = useMongo("monthlyCap", []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // console.log("BudgetsContext: Clearing data (auth false, or loading finished and not auth).");
      setBudgets([]);
      setExpenses([]);
      setMonthlyCap([]);
    }
  }, [isAuthenticated, authLoading, setBudgets, setExpenses, setMonthlyCap]);

  async function addExpense({ description, amount, budgetId }) {
    if (!isAuthenticated) { console.error("User not authenticated, cannot add expense"); return; }
    const newExpense = { id: uuidV4(), description, amount, budgetId };
    const savedExpense = await postSingleItemToAPI("expenses", newExpense);
    if (savedExpense) {
      setExpenses((prevExpenses) => [...prevExpenses, savedExpense]);
    } else { console.error("Failed to save expense to server"); }
  }

  async function addBudget({ name, max }) {
    if (!isAuthenticated) { console.error("User not authenticated, cannot add budget"); return; }
    if (budgets.find((budget) => budget.name === name)) {
      alert("Budget with this name already exists.");
      return;
    }
    const newBudget = { id: uuidV4(), name, max };
    const savedBudget = await postSingleItemToAPI("budgets", newBudget);
    if (savedBudget) {
      setBudgets((prevBudgets) => [...prevBudgets, savedBudget]);
    } else { console.error("Failed to save budget to server"); }
  }

  async function deleteBudgetClient({ id }) {
    if (!isAuthenticated) { console.error("User not authenticated, cannot delete budget"); return; }
    const result = await deleteItemFromAPI("budgets", id);
    if (result) {
      setBudgets((prevBudgets) => prevBudgets.filter((budget) => budget.id !== id));
      const updatedExpenses = await fetchDataFromAPI("expenses");
      if (updatedExpenses) setExpenses(updatedExpenses);
    } else { console.error("Failed to delete budget from server"); }
  }

  async function deleteExpenseClient({ id }) {
    if (!isAuthenticated) { console.error("User not authenticated, cannot delete expense"); return; }
    const result = await deleteItemFromAPI("expenses", id);
    if (result) {
      setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id));
    } else { console.error("Failed to delete expense from server"); }
  }

  async function setMonthlyCapTotal(capAmountStr) {
    if (!isAuthenticated) { console.error("User not authenticated, cannot set cap"); return; }
    const amount = parseFloat(capAmountStr);
    let capDataPayload = {};
    if (!isNaN(amount) && amount > 0) {
      capDataPayload = { cap: amount };
    }
    const result = await postMonthlyCapToAPI(capDataPayload);
    if (result) {
      setMonthlyCap(result);
    } else {
      console.error("Failed to set monthly cap on server");
