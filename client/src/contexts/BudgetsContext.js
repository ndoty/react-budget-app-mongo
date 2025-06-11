import React, { createContext, useContext, useEffect } from "react";
import { Container } from "react-bootstrap";
import { v4 as uuidV4 } from "uuid";

import useMongo, {
  postSingleItemToAPI,
  deleteItemFromAPI,
  postMonthlyCapToAPI,
  fetchDataFromAPI,
} from "../hooks/useMongo";

import { useAuth } from "./AuthContext";

const BudgetsContext = createContext(undefined);

export const UNCATEGORIZED_BUDGET_ID = "Uncategorized";
export const BILLS_BUDGET_ID = "Bills"; // MODIFIED: Add a constant for our new Bills category

export function useBudgets() {
  const context = useContext(BudgetsContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetsProvider");
  }
  return context;
}

export const BudgetsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, token } = useAuth();

  const [budgets, setBudgets] = useMongo("budgets", []);
  const [expenses, setExpenses] = useMongo("expenses", []);

  useEffect(() => {
    // This effect to clear data on logout remains unchanged
    if (!authLoading && !isAuthenticated) {
      setBudgets([]);
      setExpenses([]);
    }
  }, [isAuthenticated, authLoading, setBudgets, setExpenses]);

  function getBudgetExpenses(budgetId) {
    return Array.isArray(expenses)
      ? expenses.filter((expense) => expense.budgetId === budgetId)
      : [];
  }

  // MODIFIED: 'isBill' parameter is removed
  async function addExpense({ description, amount, budgetId }) {
    if (!isAuthenticated || !token) {
      console.error("User not authenticated/no token for addExpense");
      return;
    }
    const newExpense = { id: uuidV4(), description, amount, budgetId };
    const savedExpense = await postSingleItemToAPI("expenses", newExpense, token);
    if (savedExpense) {
      setExpenses((prev) => [...(Array.isArray(prev) ? prev : []), savedExpense]);
    } else {
      console.error("Failed to save expense");
    }
  }

  async function addBudget({ name, max }) {
    if (!isAuthenticated || !token) {
      console.error("User not authenticated/no token for addBudget");
      return;
    }
    if (Array.isArray(budgets) && budgets.find((b) => b.name === name)) {
      alert("Budget with this name already exists.");
      return;
    }
    const newBudget = { id: uuidV4(), name, max };
    const savedBudget = await postSingleItemToAPI("budgets", newBudget, token);
    if (savedBudget) {
      setBudgets((prev) => [...(Array.isArray(prev) ? prev : []), savedBudget]);
    } else {
      console.error("Failed to save budget");
    }
  }

  async function deleteBudgetClient({ id }) {
    if (!isAuthenticated || !token) {
      console.error("User not authenticated/no token for deleteBudget");
      return;
    }
    const result = await deleteItemFromAPI("budgets", id, token);
    if (result) {
      setBudgets((prev) =>
        Array.isArray(prev) ? prev.filter((b) => b.id !== id) : []
      );
      // Also refetch expenses in case some were under the deleted budget
      const updatedExpenses = await fetchDataFromAPI("expenses", token);
      if (updatedExpenses) setExpenses(updatedExpenses);
    } else {
      console.error("Failed to delete budget");
    }
  }

  async function deleteExpenseClient({ id }) {
    if (!isAuthenticated || !token) {
      console.error("User not authenticated/no token for deleteExpense");
      return;
    }
    const result = await deleteItemFromAPI("expenses", id, token);
    if (result) {
      setExpenses((prev) =>
        Array.isArray(prev) ? prev.filter((exp) => exp.id !== id) : []
      );
    } else {
      console.error("Failed to delete expense");
    }
  }
  
  // No other functions need changing

  if (authLoading) {
    return <Container className="my-4" style={{ textAlign: 'center' }}><p>Loading User Data (waiting for auth)...</p></Container>;
  }

  return (
    <BudgetsContext.Provider
      value={{
        budgets,
        expenses,
        getBudgetExpenses,
        addExpense,
        addBudget,
        deleteBudget: deleteBudgetClient,
        deleteExpense: deleteExpenseClient,
        BILLS_BUDGET_ID, // MODIFIED: Expose the new constant
      }}
    >
      {children}
    </BudgetsContext.Provider>
  );
};
