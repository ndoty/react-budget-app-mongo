// client/src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { Button, Stack, Container, Nav, Navbar, Form } from "react-bootstrap";

// Components
// MODIFIED: Removed import for AddFixedMonthlyTotalModal
import AddBudgetModal from "./components/AddBudgetModal";
import EditBudgetModal from "./components/EditBudgetModal";
import AddExpenseModal from "./components/AddExpenseModal";
import EditExpenseModal from "./components/EditExpenseModal";
import MoveExpenseModal from "./components/MoveExpenseModal";
import ViewExpensesModal from "./components/ViewExpensesModal";
import AddIncomeModal from "./components/AddIncomeModal";
import IncomeCard from "./components/IncomeCard";
import ViewIncomeModal from "./components/ViewIncomeModal";
import EditIncomeModal from "./components/EditIncomeModal";
import BudgetCard from "./components/BudgetCard";
import UncategorizedBudgetCard from "./components/UncategorizedBudgetCard";
import TotalBudgetCard from "./components/TotalBudgetCard";

// Contexts & Hooks
import { UNCATEGORIZED_BUDGET_ID, BudgetsProvider } from "./contexts/BudgetsContext";
import { useAuth, AuthProvider } from "./contexts/AuthContext";

// --- Authentication Pages ---
function LoginPage() { /* ... (no changes) ... */ }
function RegisterPage() { /* ... (no changes) ... */ }

// --- Main application component for budgets ---
function BudgetAppContent() {
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [viewExpensesModalBudgetId, setViewExpensesModalBudgetId] = useState(null);
  const [addExpenseModalBudgetId, setAddExpenseModalBudgetId] = useState();
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);
  const [editBudgetId, setEditBudgetId] = useState(null);

  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState(null);
  
  const [showMoveExpenseModal, setShowMoveExpenseModal] = useState(false);
  const [moveExpenseId, setMoveExpenseId] = useState(null);

  const [showViewIncomeModal, setShowViewIncomeModal] = useState(false);
  const [showEditIncomeModal, setShowEditIncomeModal] = useState(false);
  const [editIncomeId, setEditIncomeId] = useState(null);

  const { budgets, getBudgetExpenses } = useBudgets();
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  function openAddExpenseModal(budgetId) { setShowAddExpenseModal(true); setAddExpenseModalBudgetId(budgetId); }
  function openEditBudgetModal(budgetId) { setEditBudgetId(budgetId); setShowEditBudgetModal(true); }
  function openEditExpenseModal(expenseId) { setEditExpenseId(expenseId); setShowEditExpenseModal(true); }
  function openMoveExpenseModal(expenseId) { setMoveExpenseId(expenseId); setShowMoveExpenseModal(true); }
  function openEditIncomeModal(incomeId) { setEditIncomeId(incomeId); setShowEditIncomeModal(true); }
  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <>
      <Navbar bg="light" expand="lg" className="mb-4">
        { /* ... (Navbar unchanged) ... */ }
      </Navbar>
      <Container className="my-4">
        <Stack direction="horizontal" gap="2" className="mb-4">
          <h1 className="me-auto">Budgets</h1>
          {/* MODIFIED: Removed "Set Monthly Cap" button */}
          <Button variant="primary" onClick={() => setShowAddBudgetModal(true)}>Add Budget</Button>
          <Button variant="outline-primary" onClick={() => openAddExpenseModal()}>Add Expense</Button>
          <Button variant="success" onClick={() => setShowAddIncomeModal(true)}>Add Income</Button>
        </Stack>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", alignItems: "flex-start" }}>
          { Array.isArray(budgets) && budgets.map((budget) => {
            const amount = getBudgetExpenses(budget.id).reduce((total, expense) => total + expense.amount, 0);
            return (
              <BudgetCard
                key={budget.id}
                name={budget.name}
                amount={amount}
                max={budget.max}
                onAddExpenseClick={() => openAddExpenseModal(budget.id)}
                onViewExpensesClick={() => setViewExpensesModalBudgetId(budget.id)}
                onEditBudgetClick={() => openEditBudgetModal(budget.id)}
              />
            );
          })}
          <UncategorizedBudgetCard onAddExpenseClick={() => openAddExpenseModal(UNCATEGORIZED_BUDGET_ID)} onViewExpensesClick={() => setViewExpensesModalBudgetId(UNCATEGORIZED_BUDGET_ID)} />
          <IncomeCard onViewIncomeClick={() => setShowViewIncomeModal(true)} />
          <TotalBudgetCard />
        </div>
      </Container>

      {/* --- Modals --- */}
      <AddBudgetModal show={showAddBudgetModal} handleClose={() => setShowAddBudgetModal(false)} />
      <AddIncomeModal show={showAddIncomeModal} handleClose={() => setShowAddIncomeModal(false)} />
      <AddExpenseModal show={showAddExpenseModal} defaultBudgetId={addExpenseModalBudgetId} handleClose={() => setShowAddExpenseModal(false)} />
      {/* MODIFIED: Removed AddFixedMonthlyTotalModal */}
      
      <ViewExpensesModal
        budgetId={viewExpensesModalBudgetId}
        handleClose={() => setViewExpensesModalBudgetId(null)}
        onEditExpenseClick={openEditExpenseModal}
        onMoveExpenseClick={openMoveExpenseModal}
      />
      
      <ViewIncomeModal 
        show={showViewIncomeModal} 
        handleClose={() => setShowViewIncomeModal(false)}
        onEditIncomeClick={openEditIncomeModal}
      />

      {editBudgetId && ( <EditBudgetModal show={showEditBudgetModal} handleClose={() => { setShowEditBudgetModal(false); setEditBudgetId(null); }} budgetId={editBudgetId} /> )}
      {editExpenseId && ( <EditExpenseModal show={showEditExpenseModal} handleClose={() => { setShowEditExpenseModal(false); setEditExpenseId(null); }} expenseId={editExpenseId} /> )}
      {moveExpenseId && ( <MoveExpenseModal show={showMoveExpenseModal} handleClose={() => { setShowMoveExpenseModal(false); setMoveExpenseId(null); }} expenseId={moveExpenseId} /> )}
      
      {editIncomeId && (
        <EditIncomeModal
          show={showEditIncomeModal}
          handleClose={() => { setShowEditIncomeModal(false); setEditIncomeId(null); }}
          incomeId={editIncomeId}
        />
      )}
    </>
  );
}

// --- Protected Route Component ---
function ProtectedRoute({ children }) { /* ... (no changes) ... */ }

// --- Main App Component ---
function App() {
  return (
    <Router>
      <AuthProvider>
        <BudgetsProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={ <ProtectedRoute> <BudgetAppContent /> </ProtectedRoute> } />
            <Route path="*" element={ <Navigate to="/login" replace />} />
          </Routes>
        </BudgetsProvider>
      </AuthProvider>
    </Router>
  );
}
export default App;
