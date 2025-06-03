import React, { createContext, useContext, useEffect, useState } from "react";
import { Container } from "react-bootstrap"; // Keep this
import { v4 as uuidV4 } from "uuid";
import useMongo, { postSingleItemToAPI, deleteItemFromAPI, postMonthlyCapToAPI, fetchDataFromAPI } from "../hooks/useMongo";
import { useAuth } from "./AuthContext";

const BudgetsContext = createContext();

export const UNCATEGORIZED_BUDGET_ID = "Uncategorized";

export function useBudgets() {
  return useContext(BudgetsContext);
}

export const BudgetsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth(); // authLoading comes from AuthContext's internalLoading

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

  // ... (all your budget/expense functions: addExpense, addBudget, etc. Make sure they check isAuthenticated if necessary)
  async function addExpense({ description, amount, budgetId }) {
    if (!isAuthenticated) { console.error("User not authenticated"); return; }
    const newExpense = { id: uuidV4(), description, amount, budgetId };
    const savedExpense = await postSingleItemToAPI("expenses", newExpense);
    if (savedExpense) {
      setExpenses((prevExpenses) => [...prevExpenses, savedExpense]);
    } else { console.error("Failed to save expense to server"); }
  }

  async function addBudget({ name, max }) {
    if (!isAuthenticated) { console.error("User not authenticated"); return; }
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
    if (!isAuthenticated) { console.error("User not authenticated"); return; }
    const result = await deleteItemFromAPI("budgets", id);
    if (result) {
      setBudgets((prevBudgets) => prevBudgets.filter((budget) => budget.id !== id));
      const updatedExpenses = await fetchDataFromAPI("expenses");
      if (updatedExpenses) setExpenses(updatedExpenses);
    } else { console.error("Failed to delete budget from server"); }
  }

  async function deleteExpenseClient({ id }) {
    if (!isAuthenticated) { console.error("User not authenticated"); return; }
    const result = await deleteItemFromAPI("expenses", id);
    if (result) {
      setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id));
    } else { console.error("Failed to delete expense from server"); }
  }

  async function setMonthlyCapTotal(capAmountStr) {
    if (!isAuthenticated) { console.error("User not authenticated"); return; }
    const amount = parseFloat(capAmountStr);
    let capDataPayload = {}; // Send empty object to clear/delete cap
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

  // This is the crucial check. If authLoading is true, BudgetsProvider waits.
  if (authLoading) {
    return <Container className="my-4"><p>Loading budget data (waiting for auth)...</p></Container>;
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
