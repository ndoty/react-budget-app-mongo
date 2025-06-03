// client/src/contexts/BudgetsContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import useMongo, { postSingleItemToAPI, deleteItemFromAPI, postMonthlyCapToAPI, fetchDataFromAPI } from "../hooks/useMongo";
import { useAuth } from "./AuthContext";

const BudgetsContext = createContext();

export const UNCATEGORIZED_BUDGET_ID = "Uncategorized";

export function useBudgets() {
  return useContext(BudgetsContext);
}

export const BudgetsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, currentUser } = useAuth(); // Destructure currentUser as well if needed later

  // Pass authLoading to useMongo if it needs to wait, or handle loading state here.
  // For simplicity, useMongo itself also now uses useAuth to get isAuthenticated and authLoading.
  const [budgets, setBudgets] = useMongo("budgets", []);
  const [expenses, setExpenses] = useMongo("expenses", []);
  const [monthlyCap, setMonthlyCap] = useMongo("monthlyCap", []);

  // This effect is fine for clearing data on logout.
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      // console.log("BudgetsContext: User logged out or auth not ready, clearing data.");
      setBudgets([]);
      setExpenses([]);
      setMonthlyCap([]);
    }
  }, [isAuthenticated, authLoading, setBudgets, setExpenses, setMonthlyCap]);


  // ... (rest of your functions: getBudgetExpenses, addExpense, addBudget, etc.)
  // Ensure these functions check for isAuthenticated if they perform actions that require it,
  // or rely on ProtectedRoute to prevent access.

  async function addExpense({ description, amount, budgetId }) {
    if (!isAuthenticated) return console.error("Not authenticated to add expense");
    const newExpense = { id: uuidV4(), description, amount, budgetId };
    const savedExpense = await postSingleItemToAPI("expenses", newExpense);
    if (savedExpense) {
      setExpenses((prevExpenses) => [...prevExpenses, savedExpense]);
    } else { console.error("Failed to save expense to server"); }
  }

  async function addBudget({ name, max }) {
    if (!isAuthenticated) return console.error("Not authenticated to add budget");
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
    if (!isAuthenticated) return console.error("Not authenticated to delete budget");
    const result = await deleteItemFromAPI("budgets", id);
    if (result) {
      setBudgets((prevBudgets) => prevBudgets.filter((budget) => budget.id !== id));
      const updatedExpenses = await fetchDataFromAPI("expenses"); // Refetch
      if (updatedExpenses) setExpenses(updatedExpenses);
    } else { console.error("Failed to delete budget from server"); }
  }

  async function deleteExpenseClient({ id }) {
    if (!isAuthenticated) return console.error("Not authenticated to delete expense");
    const result = await deleteItemFromAPI("expenses", id);
    if (result) {
      setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== id));
    } else { console.error("Failed to delete expense from server"); }
  }

  async function setMonthlyCapTotal(capAmountStr) {
    if (!isAuthenticated) return console.error("Not authenticated to set monthly cap");
    const amount = parseFloat(capAmountStr);
    let capDataPayload = {};
    if (!isNaN(amount) && amount > 0) {
      capDataPayload = { cap: amount };
    }
    const result = await postMonthlyCapToAPI(capDataPayload);
    if (result) {
      setMonthlyCap(result);
    } else { console.error("Failed to set monthly cap on server"); }
  }

  // If auth is still loading, you might want to render a loading state from BudgetsProvider too,
  // or ensure its children (like BudgetAppContent) handle this.
  if (authLoading) {
    // Or return null, or a specific loading component for this context
    return <Container className="my-4"><p>Loading budget data...</p></Container>;
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
