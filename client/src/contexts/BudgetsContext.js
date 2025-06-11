// client/src/contexts/BudgetsContext.js
import React, { createContext, useContext, useEffect } from "react";
import { Container } from "react-bootstrap";
import { v4 as uuidV4 } from "uuid";

import useMongo, {
  postSingleItemToAPI,
  deleteItemFromAPI,
  updateItemInAPI,
  fetchDataFromAPI,
} from "../hooks/useMongo";

import { useAuth } from "./AuthContext";

// Define the empty array outside the component to ensure it has a stable reference.
const EMPTY_ARRAY = [];

const BudgetsContext = createContext(undefined);

export const UNCATEGORIZED_BUDGET_ID = "Uncategorized";
export const BILLS_BUDGET_ID = "Bills";

export function useBudgets() {
  const context = useContext(BudgetsContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetsProvider");
  }
  return context;
}

export const BudgetsProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, token } = useAuth();

  // Use the stable EMPTY_ARRAY constant for the initial value.
  const [budgets, setBudgets] = useMongo("budgets", EMPTY_ARRAY);
  const [expenses, setExpenses] = useMongo("expenses", EMPTY_ARRAY);
  const [income, setIncome] = useMongo("income", EMPTY_ARRAY);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setBudgets(EMPTY_ARRAY);
      setExpenses(EMPTY_ARRAY);
      setIncome(EMPTY_ARRAY);
    }
  }, [isAuthenticated, authLoading, setBudgets, setExpenses, setIncome]);

  function getBudgetExpenses(budgetId) {
    return Array.isArray(expenses)
      ? expenses.filter((expense) => expense.budgetId === budgetId)
      : [];
  }
    
  function getIncomeItem(incomeId) {
    return Array.isArray(income) ? income.find((i) => i.id === incomeId) : undefined;
  }
    
  function getBudget(budgetId) {
    return Array.isArray(budgets) ? budgets.find((b) => b.id === budgetId) : undefined;
  }
  
  function getExpense(expenseId) {
    return Array.isArray(expenses) ? expenses.find(e => e.id === expenseId) : undefined;
  }

  async function addExpense({ description, amount, budgetId }) {
    if (!isAuthenticated || !token) return;
    const newExpense = { id: uuidV4(), description, amount, budgetId };
    const savedExpense = await postSingleItemToAPI("expenses", newExpense, token);
    if (savedExpense) {
      setExpenses((prev) => [...(Array.isArray(prev) ? prev : []), savedExpense]);
    }
  }
  
  async function addIncome({ description, amount }) {
    if (!isAuthenticated || !token) return;
    const newIncome = { id: uuidV4(), description, amount };
    const savedIncome = await postSingleItemToAPI("income", newIncome, token);
    if(savedIncome) {
        setIncome(prev => [...(Array.isArray(prev) ? prev : []), savedIncome]);
    }
  }

  async function addBudget({ name, max }) {
    if (!isAuthenticated || !token) return;
    if (Array.isArray(budgets) && budgets.find((b) => b.name === name)) {
      alert("Budget with this name already exists.");
      return;
    }
    const newBudget = { id: uuidV4(), name, max };
    const savedBudget = await postSingleItemToAPI("budgets", newBudget, token);
    if (savedBudget) {
      setBudgets((prev) => [...(Array.isArray(prev) ? prev : []), savedBudget]);
    }
  }

  async function deleteBudget({ id }) {
    if (!isAuthenticated || !token) return;
    const result = await deleteItemFromAPI("budgets", id, token);
    if (result) {
      setBudgets((prev) => (Array.isArray(prev) ? prev.filter((b) => b.id !== id) : []));
      const updatedExpenses = await fetchDataFromAPI("expenses", token);
      if (updatedExpenses) setExpenses(updatedExpenses);
    }
  }
    
  async function deleteIncome({ id }) {
    if (!isAuthenticated || !token) return;
    const result = await deleteItemFromAPI("income", id, token);
    if (result) {
        setIncome(prev => Array.isArray(prev) ? prev.filter(i => i.id !== id) : []);
    }
  }

  async function deleteExpense({ id }) {
    if (!isAuthenticated || !token) return;
    const result = await deleteItemFromAPI("expenses", id, token);
    if (result) {
      setExpenses((prev) => (Array.isArray(prev) ? prev.filter((exp) => exp.id !== id) : []));
    }
  }
  
  async function updateBudget({ id, ...updates }) {
    if (!isAuthenticated || !token) return;
    const updatedBudget = await updateItemInAPI("budgets", id, updates, token);
    if (updatedBudget) {
      setBudgets(prevBudgets => prevBudgets.map(b => b.id === id ? updatedBudget : b));
    }
  }
  
  async function updateExpense({ id, ...updates }) {
    if (!isAuthenticated || !token) return;
    const updatedExpense = await updateItemInAPI("expenses", id, updates, token);
    if (updatedExpense) {
      setExpenses(prevExpenses => prevExpenses.map(e => e.id === id ? updatedExpense : e));
    }
  }
  
  async function updateIncome({ id, ...updates }) {
    if (!isAuthenticated || !token) return;
    const updatedIncome = await updateItemInAPI("income", id, updates, token);
    if (updatedIncome) {
        setIncome(prevIncome => prevIncome.map(i => i.id === id ? updatedIncome : i));
    }
  }

  if (authLoading) {
    return <Container className="my-4" style={{ textAlign: 'center' }}><p>Loading User Data (waiting for auth)...</p></Container>;
  }

  return (
    <BudgetsContext.Provider
      value={{
        budgets,
        expenses,
        income,
        getBudgetExpenses,
        getIncomeItem,
        getBudget,
        getExpense,
        addExpense,
        addIncome,
        addBudget,
        deleteBudget,
        deleteIncome,
        deleteExpense,
        updateBudget,
        updateExpense,
        updateIncome,
        BILLS_BUDGET_ID,
        UNCATEGORIZED_BUDGET_ID,
      }}
    >
      {children}
    </BudgetsContext.Provider>
  );
};
