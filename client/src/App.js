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
import ChangePasswordModal from "./components/ChangePasswordModal";
import ImportDataModal from "./components/ImportDataModal";
import DeleteAccountModal from "./components/DeleteAccountModal";
import Logo from './components/Logo';

// Contexts & Hooks
import { UNCATEGORIZED_BUDGET_ID, useBudgets, BudgetsProvider } from "./contexts/BudgetsContext";
import { useAuth, AuthProvider } from "./contexts/AuthContext";

// --- Authentication Pages ---
function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { success, message } = await login(username, password);
    if (success) {
      navigate("/");
    } else {
      setError(message);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <h2 className="text-center mb-4">Log In</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group id="username">
            <Form.Label>Username</Form.Label>
            <Form.Control type="text" value={username} onChange={e => setUsername(e.target.value)} required />
          </Form.Group>
          <Form.Group id="password">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </Form.Group>
          <Button className="w-100 mt-3" type="submit">Log In</Button>
        </Form>
        <div className="w-100 text-center mt-2">
          Need an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </Container>
  );
}

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    setError('');
    setMessage('');
    const { success, message: regMessage } = await register(username, password);
    if (success) {
      setMessage("Registration successful! You can now log in.");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setError(regMessage);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <h2 className="text-center mb-4">Register</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group id="username">
            <Form.Label>Username</Form.Label>
            <Form.Control type="text" value={username} onChange={e => setUsername(e.target.value)} required />
          </Form.Group>
          <Form.Group id="password">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </Form.Group>
          <Form.Group id="confirm-password">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </Form.Group>
          <Button className="w-100 mt-3" type="submit">Register</Button>
        </Form>
        <div className="w-100 text-center mt-2">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
      </div>
    </Container>
  );
}

// --- Main application component for budgets ---
function BudgetAppContent({ openAddExpenseModal, setShowAddBudgetModal, setShowAddIncomeModal, setViewExpensesModalBudgetId, setEditBudgetModalId, onViewIncomeClick, onViewBillsClick }) {
  const { budgets, getBudgetExpenses } = useBudgets();
  
  return (
    <Container className="my-4">
      <Stack direction="horizontal" gap="2" className="mb-4">
        <h1 className="me-auto" style={{visibility: 'hidden'}}>Budgets</h1>
        <Button variant="primary" onClick={() => setShowAddBudgetModal(true)}>Add Budget</Button>
        <Button variant="success" onClick={() => setShowAddIncomeModal(true)}>Add Income</Button>
        <Button variant="outline-primary" onClick={() => openAddExpenseModal(null, false)}>Add Expense / Bill</Button>
      </Stack>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", alignItems: "flex-start" }}>
        <TotalBudgetCard onViewIncomeClick={onViewIncomeClick} onViewBillsClick={onViewBillsClick} />
        { Array.isArray(budgets) && budgets.map((budget) => {
          const amount = getBudgetExpenses(budget.id).reduce((total, expense) => total + expense.amount, 0);
          return (
            <BudgetCard
              key={budget.id}
              name={budget.name}
              amount={amount}
              max={budget.max}
              onAddExpenseClick={() => openAddExpenseModal(budget.id, false)}
              onViewExpensesClick={() => setViewExpensesModalBudgetId(budget.id)}
              onEditBudgetClick={() => setEditBudgetModalId(budget.id)}
            />
          );
        })}
        <UncategorizedBudgetCard onAddExpenseClick={() => openAddExpenseModal(UNCATEGORIZED_BUDGET_ID, false)} onViewExpensesClick={() => setViewExpensesModalBudgetId(UNCATEGORIZED_BUDGET_ID)} />
      </div>
    </Container>
  );
}

// --- Protected Route Component ---
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Container className="my-4" style={{textAlign: 'center'}}><p>Authenticating...</p></Container>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// --- Main Layout Component ---
function AppLayout() {
  const { currentUser, logout } = useAuth();
  const { exportData } = useBudgets();
  const navigate = useNavigate();

  // State for all modals is lifted to this central layout component
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [addExpenseModalBudgetId, setAddExpenseModalBudgetId] = useState();
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [viewExpensesModalBudgetId, setViewExpensesModalBudgetId] = useState();
  const [showViewIncomeModal, setShowViewIncomeModal] = useState(false);
  const [showViewBillsModal, setShowViewBillsModal] = useState(false);
  const [editIncomeModalId, setEditIncomeModalId] = useState();
  const [editExpenseId, setEditExpenseId] = useState();
  const [editBudgetModalId, setEditBudgetModalId] = useState();
  const [moveExpenseModalId, setMoveExpenseModalId] = useState();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showImportDataModal, setShowImportDataModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [addExpenseAsBill, setAddExpenseAsBill] = useState(false);

  const openAddExpenseModal = (budgetId, isBill = false) => {
    setShowAddExpenseModal(true);
    setAddExpenseModalBudgetId(budgetId);
    setAddExpenseAsBill(isBill);
  };
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  const handleAddBillClick = () => {
    setShowViewBillsModal(false);
    openAddExpenseModal(null, true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar bg="light" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">
            <Logo />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav>
              {currentUser && (
                <NavDropdown title={`Signed in as: ${currentUser.username}`} id="basic-nav-dropdown">
                  <NavDropdown.Item onClick={() => setShowChangePasswordModal(true)}>
                    Change Password
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={exportData}>Export Data</NavDropdown.Item>
                  <NavDropdown.Item onClick={() => setShowImportDataModal(true)}>Import Data</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={() => setShowDeleteAccountModal(true)} className="text-danger">
                    Delete Account
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

      <main style={{ flex: '1 0 auto' }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <BudgetAppContent 
                openAddExpenseModal={openAddExpenseModal}
                setShowAddBudgetModal={setShowAddBudgetModal}
                setShowAddIncomeModal={setShowAddIncomeModal}
                setViewExpensesModalBudgetId={setViewExpensesModalBudgetId}
                setEditBudgetModalId={setEditBudgetModalId}
                onViewIncomeClick={() => setShowViewIncomeModal(true)}
                onViewBillsClick={() => setShowViewBillsModal(true)}
              />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>

      {/* All modals are rendered here */}
      <AddBudgetModal show={showAddBudgetModal} handleClose={() => setShowAddBudgetModal(false)} />
      <AddExpenseModal 
        show={showAddExpenseModal} 
        defaultBudgetId={addExpenseModalBudgetId}
        isBillDefault={addExpenseAsBill}
        handleClose={() => {
            setShowAddExpenseModal(false);
            setAddExpenseAsBill(false);
        }} 
      />
      <AddIncomeModal show={showAddIncomeModal} handleClose={() => setShowAddIncomeModal(false)} />
      <ViewExpensesModal 
        budgetId={viewExpensesModalBudgetId} 
        handleClose={() => setViewExpensesModalBudgetId()}
        onEditExpenseClick={(id) => { setViewExpensesModalBudgetId(); setEditExpenseId(id); }}
        onMoveExpenseClick={(id) => { setViewExpensesModalBudgetId(); setMoveExpenseModalId(id); }}
      />
      <ViewIncomeModal show={showViewIncomeModal} handleClose={() => setShowViewIncomeModal(false)} onEditIncomeClick={(id) => { setShowViewIncomeModal(false); setEditIncomeModalId(id); }} />
      <ViewBillsModal 
        show={showViewBillsModal} 
        handleClose={() => setShowViewBillsModal(false)} 
        onEditExpenseClick={(id) => { setShowViewBillsModal(false); setEditExpenseId(id); }}
        onAddBillClick={handleAddBillClick}
      />
      <EditBudgetModal show={editBudgetModalId != null} handleClose={() => setEditBudgetModalId(null)} budgetId={editBudgetModalId} />
      <EditExpenseModal show={editExpenseId != null} handleClose={() => setEditExpenseId(null)} expenseId={editExpenseId} />
      <EditIncomeModal show={editIncomeModalId != null} handleClose={() => setEditIncomeModalId(null)} incomeId={editIncomeModalId} />
      <MoveExpenseModal show={moveExpenseModalId != null} handleClose={() => setMoveExpenseModalId(null)} expenseId={moveExpenseModalId} />
      <ChangePasswordModal show={showChangePasswordModal} handleClose={() => setShowChangePasswordModal(false)} />
      <ImportDataModal show={showImportDataModal} handleClose={() => setShowImportDataModal(false)} />
      <DeleteAccountModal show={showDeleteAccountModal} handleClose={() => setShowDeleteAccountModal(false)} />
      
      <VersionFooter />
    </div>
  );
}


function App() {
  return (
    <Router>
      <AuthProvider>
        <BudgetsProvider>
          <AppLayout />
        </BudgetsProvider>
      </AuthProvider>
    </Router>
  );
}
export default App;