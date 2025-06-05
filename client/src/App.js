// client/src/App.js
import React, { useState, useEffect } from "react"; // Added useEffect
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { Button, Stack, Container, Nav, Navbar, Form } from "react-bootstrap";

// Components - Ensure these paths are correct
import AddFixedMonthlyTotalModal from "./components/AddFixedMonthlyTotal";
import AddBudgetModal from "./components/AddBudgetModal";
import AddExpenseModal from "./components/AddExpenseModal";
import ViewExpensesModal from "./components/ViewExpensesModal";
import BudgetCard from "./components/BudgetCard";
import UncategorizedBudgetCard from "./components/UncategorizedBudgetCard";
import TotalBudgetCard from "./components/TotalBudgetCard";

// Contexts & Hooks
import { UNCATEGORIZED_BUDGET_ID, useBudgets, BudgetsProvider } from "./contexts/BudgetsContext";
import { useAuth, AuthProvider } from "./contexts/AuthContext";

// --- Authentication Pages ---
function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading: authContextLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await login(username, password);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.message || "Failed to login");
    }
  };

  return (
    <Container className="my-4" style={{ maxWidth: "400px", paddingTop: '50px' }}>
      <h2>Login</h2>
      {error && <p className="text-danger">{error}</p>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3"><Form.Label>Username</Form.Label><Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /></Form.Group>
        <Form.Group className="mb-3"><Form.Label>Password</Form.Label><Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Form.Group>
        <Button type="submit" variant="primary" disabled={auth
