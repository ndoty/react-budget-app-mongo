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
  // authLoading from useAuth() will be false once AuthProvider has finished its internalLoading
  const { isAuthenticated, loading: authLoading } = useAuth();

  // console.log("BudgetsProvider received - authLoading:", authLoading, "isAuthenticated:", isAuthenticated);

  const [budgets, setBudgets] = useMongo("budgets", []);
  const [expenses, setExpenses] = useMongo("expenses", []);
  const [monthlyCap, setMonthlyCap] = useMongo("monthlyCap", []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // console.log("BudgetsContext: Clearing data (auth false, or loading finished and not auth).");
      setBudgets([]);
      setExpenses([]);
      setMonthlyCap([]);
    } else if (!authLoading && isAuthenticated) {
      // console.log("BudgetsContext: Auth ready and authenticated. useMongo will fetch.");
      // Data fetching is handled by useMongo's own useEffect based on isAuthenticated
    }
  }, [isAuthenticated, authLoading, setBudgets, setExpenses, setMonthlyCap]);

  // ... (budget/expense functions - ensure they check isAuthenticated or rely on ProtectedRoute) ...
  // Ensure these functions are correctly defined as in previous versions.

  // If AuthProvider is still initializing (authLoading is true),
  // BudgetsProvider shows its own loading state.
  if (authLoading) {
    // console.log("BudgetsProvider: Waiting for auth (authLoading is true).");
    return <Container className="my-4"><p>Loading budget data (waiting for auth)...</p></Container>;
  }

  // If authLoading is false, it means AuthProvider has initialized.
  // Now, BudgetsProvider can render its content.
  // The `isAuthenticated` flag will determine if `useMongo` actually fetches data.
  // console.log("BudgetsProvider: Auth ready. Rendering actual budget context and children.");
  return (
    <BudgetsContext.Provider
      value={{
        budgets,
        expenses,
        monthlyCap,
        // ... (rest of the context value, make sure functions are complete)
        getBudgetExpenses: (budgetId) => expenses.filter((expense) => expense.budgetId === budgetId),
        addExpense: async (expenseData) => {
            if (!isAuthenticated) return;
            const newExpense = { id: uuidV4(), ...expenseData };
            const savedExpense = await postSingleItemToAPI("expenses", newExpense);
            if (savedExpense) setExpenses((prev) => [...prev, savedExpense]);
            else console.error("Failed to save expense");
        },
        addBudget:  async ({ name, max }) => {
            if (!isAuthenticated) return;
            if (budgets.find((budget) => budget.name === name)) {
              alert("Budget with this name already exists."); return;
            }
            const newBudget = { id: uuidV4(), name, max };
            const savedBudget = await postSingleItemToAPI("budgets", newBudget);
            if (savedBudget) setBudgets((prev) => [...prev, savedBudget]);
            else console.error("Failed to save budget");
        },
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
