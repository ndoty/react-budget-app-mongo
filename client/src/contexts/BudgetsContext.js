// client/src/contexts/BudgetsContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { v4 as uuidV4 } from "uuid";
import useMongo, { postSingleItemToAPI, deleteItemFromAPI, postMonthlyCapToAPI, fetchDataFromAPI } from "../hooks/useMongo";
import { useAuth } from "./AuthContext";

const BudgetsContext = createContext(undefined); // Or a default shape

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

  // console.log("BudgetsProvider - authLoading:", authLoading, "isAuthenticated:", isAuthenticated);

  const [budgets, setBudgets] = useMongo("budgets", []);
  const [expenses, setExpenses] = useMongo("expenses", []);
  const [monthlyCap, setMonthlyCap] = useMongo("monthlyCap", []);

  useEffect(() => {
    // This effect will clear data if the user logs out OR if auth wasn't ready and now is not authenticated.
    if (!authLoading && !isAuthenticated) {
      // console.log("BudgetsContext: Clearing data as user is not authenticated or auth state changed to not authenticated.");
      setBudgets([]);
      setExpenses([]);
      setMonthlyCap([]);
    }
  }, [isAuthenticated, authLoading, setBudgets, setExpenses, setMonthlyCap]);

  // Functions (addExpense, addBudget, etc. should ideally check isAuthenticated before proceeding)
  // Example:
  async function addBudget({ name, max }) {
    if (!isAuthenticated) {
      console.error("Cannot add budget: User not authenticated.");
      return;
    }
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
  // ... (Implement similar checks for other mutation functions if needed,
  // though ProtectedRoute should prevent these components from being used when not authenticated)


  // If authLoading is true, it means AuthProvider is still figuring out the auth state.
  // During this time, BudgetsProvider should also indicate loading.
  if (authLoading) {
    return <Container className="my-4"><p>Loading budget data (waiting for auth)...</p></Container>;
  }

  // If authLoading is false, AuthProvider has determined the auth state.
  // Now BudgetsProvider can provide its context.
  // The useMongo hooks will also see authLoading as false and will fetch data if isAuthenticated is true.
  return (
    <BudgetsContext.Provider
      value={{
        budgets,
        expenses,
        monthlyCap,
        getBudgetExpenses: (budgetId) => expenses.filter((expense) => expense.budgetId === budgetId),
        addExpense: async (expenseData) => {
            if (!isAuthenticated) return;
            const newExpense = { id: uuidV4(), ...expenseData };
            const savedExpense = await postSingleItemToAPI("expenses", newExpense);
            if (savedExpense) setExpenses((prev) => [...prev, savedExpense]);
            else console.error("Failed to save expense");
        },
        addBudget, // Use the one defined above with the check
        deleteBudget: async ({ id }) => {
            if (!isAuthenticated) return;
            const result = await deleteItemFromAPI("budgets", id);
            if (result) {
                setBudgets((prev) => prev.filter((b) => b.id !== id));
                const updatedExpenses = await fetchDataFromAPI("expenses");
                if (updatedExpenses) setExpenses(updatedExpenses);
            } else console.error("Failed to delete budget");
        },
        deleteExpense: async ({ id }) => {
            if (!isAuthenticated) return;
            const result = await deleteItemFromAPI("expenses", id);
            if (result) setExpenses((prev) => prev.filter((exp) => exp.id !== id));
            else console.error("Failed to delete expense");
        },
        setMonthlyCapTotal: async (capAmountStr) => {
            if (!isAuthenticated) return;
            const amount = parseFloat(capAmountStr);
            let payload = {};
            if (!isNaN(amount) && amount > 0) payload = { cap: amount };
            const res = await postMonthlyCapToAPI(payload);
            if (res) setMonthlyCap(res);
            else console.error("Failed to set monthly cap");
        },
      }}
    >
      {children}
    </BudgetsContext.Provider>
  );
};
