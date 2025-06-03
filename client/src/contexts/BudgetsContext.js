import React, { createContext, useContext, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { v4 as uuidV4 } from "uuid";
import useMongo, { postSingleItemToAPI, deleteItemFromAPI, postMonthlyCapToAPI, fetchDataFromAPI } from "../hooks/useMongo";
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
  const { isAuthenticated, loading: authLoading } = useAuth();

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
    // Ensure expenses is an array before filtering
    return Array.isArray(expenses) ? expenses.filter((expense) => expense.budgetId === budgetId) : [];
  }

  async function addExpense({ description, amount, budgetId }) {
    if (!isAuthenticated) { console.error("User not authenticated, cannot add expense"); return; }
    const newExpense = { id: uuidV4(), description, amount, budgetId };
    const savedExpense = await postSingleItemToAPI("expenses", newExpense);
    if (savedExpense) {
      setExpenses((prevExpenses) => [...(Array.isArray(prevExpenses) ? prevExpenses : []), savedExpense]);
    } else { console.error("Failed to save expense to server"); }
  }

  async function addBudget({ name, max }) {
    if (!isAuthenticated) { console.error("User not authenticated, cannot add budget"); return; }
    if (Array.isArray(budgets) && budgets.find((budget) => budget.name === name)) {
      alert("Budget with this name already exists.");
      return;
    }
    const newBudget = { id: uuidV4(), name, max };
    const savedBudget = await postSingleItemToAPI("budgets", newBudget);
    if (savedBudget) {
      setBudgets((prevBudgets) => [...(Array.isArray(prevBudgets) ? prevBudgets : []), savedBudget]);
    } else { console.error("Failed to save budget to server"); }
  }

  async function deleteBudgetClient({ id }) {
    if (!isAuthenticated) { console.error("User not authenticated, cannot delete budget"); return; }
    const result = await deleteItemFromAPI("budgets", id);
    if (result) {
      setBudgets((prevBudgets) => Array.isArray(prevBudgets) ? prevBudgets.filter((budget) => budget.id !== id) : []);
      const updatedExpenses = await fetchDataFromAPI("expenses");
      if (updatedExpenses) setExpenses(updatedExpenses);
    } else { console.error("Failed to delete budget from server"); }
  }

  async function deleteExpenseClient({ id }) {
    if (!isAuthenticated) { console.error("User not authenticated, cannot delete expense"); return; }
    const result = await deleteItemFromAPI("expenses", id);
    if (result) {
      setExpenses((prevExpenses) => Array.isArray(prevExpenses) ? prevExpenses.filter((expense) => expense.id !== id) : []);
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
    }
  }

  if (authLoading) {
    return <Container className="my-4" style={{textAlign: 'center'}}><p>Loading User Data...</p></Container>;
  }

  return (
    <BudgetsContext.Provider
      value={{
        budgets,
        expenses,
        monthlyCap,
        getBudgetExpenses,
        addExpense,
        addBudget,
        deleteBudget: deleteBudgetClient,
        deleteExpense: deleteExpenseClient,
        setMonthlyCapTotal,
      }}
    >
      {children}
    </BudgetsContext.Provider>
  );
};
