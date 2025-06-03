import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import useMongo, { postSingleItemToAPI, deleteItemFromAPI, postMonthlyCapToAPI, fetchDataFromAPI } from "../hooks/useMongo";
import { useAuth } from "./AuthContext";

const BudgetsContext = createContext();

export const UNCATEGORIZED_BUDGET_ID = "Uncategorized"; // This is a client-side constant

export function useBudgets() {
  return useContext(BudgetsContext);
}

export const BudgetsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [budgets, setBudgets] = useMongo("budgets", []);
  const [expenses, setExpenses] = useMongo("expenses", []);
  const [monthlyCap, setMonthlyCap] = useMongo("monthlyCap", []); // Backend sends array with one cap object or empty

  // This effect ensures data is cleared if user logs out
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      setBudgets([]);
      setExpenses([]);
      setMonthlyCap([]);
    }
  }, [isAuthenticated, authLoading, setBudgets, setExpenses, setMonthlyCap]);


  function getBudgetExpenses(budgetId) {
    return expenses.filter((expense) => expense.budgetId === budgetId);
  }

  async function addExpense({ description, amount, budgetId }) {
    const newExpense = { id: uuidV4(), description, amount, budgetId }; // client-generated id
    const savedExpense = await postSingleItemToAPI("expenses", newExpense);
    if (savedExpense) {
      setExpenses((prevExpenses) => [...prevExpenses, savedExpense]);
    } else { console.error("Failed to save expense to server"); }
  }

  async function addBudget({ name, max }) {
    if (budgets.find((budget) => budget.name === name)) {
      alert("Budget with this name already exists."); // Simple alert, consider better UX
      return;
    }
    const newBudget = { id: uuidV4(), name, max }; // client-generated id
    const savedBudget = await postSingleItemToAPI("budgets", newBudget);
    if (savedBudget) {
      setBudgets((prevBudgets) => [...prevBudgets, savedBudget]);
    } else { console.error("Failed to save budget to server"); }
  }

  async function deleteBudgetClient({ id }) { // id is the client-side UUID
    const result = await deleteItemFromAPI("budgets", id);
    if (result) {
      setBudgets((prevBudgets) => prevBudgets.filter((budget) => budget.id !== id));
      // Refetch expenses as backend reassigns them to "Uncategorized"
      const updatedExpenses = await fetchDataFromAPI("expenses");
      if (updatedExpenses) setExpenses(updatedExpenses);
    } else { console.error("Failed to delete budget from server"); }
  }

  async function deleteExpenseClient({ id }) { // id is the client-side UUID
    const result = await deleteItemFromAPI("expenses", id);
    if (result) {
      setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id));
    } else { console.error("Failed to delete expense from server"); }
  }

  async function setMonthlyCapTotal(capAmountStr) {
    const amount = parseFloat(capAmountStr);
    let capDataPayload = {};

    if (!isNaN(amount) && amount > 0) {
      capDataPayload = { cap: amount };
    }
    // If amount is 0, NaN, or not provided, {} will be sent, backend will delete current cap.

    const result = await postMonthlyCapToAPI(capDataPayload); // API expects {cap: number} or {}
    if (result) { // Backend returns array: [cap] or []
      setMonthlyCap(result);
    } else {
      console.error("Failed to set monthly cap on server");
    }
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
        deleteBudget: deleteBudgetClient, // Renamed to avoid conflict if any
        deleteExpense: deleteExpenseClient, // Renamed
        setMonthlyCapTotal,
      }}
    >
      {children}
    </BudgetsContext.Provider>
  );
};
