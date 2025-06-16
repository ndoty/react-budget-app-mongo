import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { Button, Stack, Container, Nav, Navbar, Form, NavDropdown } from "react-bootstrap";

// Components
import AddBudgetModal from "./components/AddBudgetModal";
import AddExpenseModal from "./components/AddExpenseModal";
import AddIncomeModal from "./components/AddIncomeModal";
import ViewExpensesModal from "./components/ViewExpensesModal";
import ViewIncomeModal from "./components/ViewIncomeModal";
import ViewBillsModal from "./components/ViewBillsModal";
import EditBudgetModal from "./components/EditBudgetModal";
import EditExpenseModal from "./components/EditExpenseModal";
import EditIncomeModal from "./components/EditIncomeModal";
import MoveExpenseModal from "./components/MoveExpenseModal";
import BudgetCard from "./components/BudgetCard";
import UncategorizedBudgetCard from "./components/UncategorizedBudgetCard";
import TotalBudgetCard from "./components/TotalBudgetCard";
import VersionFooter from "./components/VersionFooter";
import ChangePasswordModal from "./components/ChangePasswordModal"; // Import the new modal

// Contexts & Hooks
import { UNCATEGORIZED_BUDGET_ID, useBudgets, BudgetsProvider } from "./contexts/BudgetsContext";
import { useAuth, AuthProvider } from "./contexts/AuthContext";

// --- Authentication Pages (no changes) ---
function LoginPage() { /* ... */ }
function RegisterPage() { /* ... */ }

// --- Main application component for budgets ---
function BudgetAppContent() {
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [viewExpensesModalBudgetId, setViewExpensesModalBudgetId] = useState();
  const [addExpenseModalBudgetId, setAddExpenseModalBudgetId] = useState();
  const [showViewIncomeModal, setShowViewIncomeModal] = useState(false);
  const [showViewBillsModal, setShowViewBillsModal] = useState(false);
  const [editIncomeModalId, setEditIncomeModalId] = useState();
  const [editExpenseId, setEditExpenseId] = useState();
  const [editBudgetModalId, setEditBudgetModalId] = useState();
  const [moveExpenseModalId, setMoveExpenseModalId] = useState();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false); // State for the new modal

  const { budgets, getBudgetExpenses } = useBudgets();
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  function openAddExpenseModal(budgetId) {
    setShowAddExpenseModal(true);
    setAddExpenseModalBudgetId(budgetId);
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <Navbar bg="light" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">TechNick Services Budget App</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav>
              {currentUser && (
                <NavDropdown title={`Signed in as: ${currentUser.username}`} id="basic-nav-dropdown">
                  <NavDropdown.Item onClick={() => setShowChangePasswordModal(true)}>
                    Change Password
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="my-4" style={{ flex: '1' }}>
        <Stack direction="horizontal" gap="2" className="mb-4">
          <h1 className="me-auto" style={{visibility: 'hidden'}}>Budgets</h1>
          <Button variant="primary" onClick={() => setShowAddBudgetModal(true)}>Add Budget</Button>
          <Button variant="success" onClick={() => setShowAddIncomeModal(true)}>Add Income</Button>
          <Button variant="outline-primary" onClick={() => openAddExpenseModal()}>Add Expense / Bill</Button>
        </Stack>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", alignItems: "flex-start" }}>
          {/* ... (rest of the cards) ... */}
        </div>
      </Container>
      {/* ... (rest of the modals) ... */}
      <ChangePasswordModal show={showChangePasswordModal} handleClose={() => setShowChangePasswordModal(false)} />
    </>
  );
}

// --- Protected Route and Main App (no changes here) ---
function ProtectedRoute({ children }) { /* ... */ }
function App() { /* ... */ }
export default App;
