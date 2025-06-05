// client/src/App.js
import React, { useState, useEffect } from "react";
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
        <Button type="submit" variant="primary" disabled={authContextLoading}>Login</Button>
        <p className="mt-3">Don't have an account? <Link to="/register">Register here</Link></p>
      </Form>
    </Container>
  );
}

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { register, loading: authContextLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    const result = await register(username, password);
    if (result.success) {
      alert("Registration successful! Please login.");
      navigate("/login");
    } else { setError(result.message || "Failed to register"); }
  };
  return (
     <Container className="my-4" style={{ maxWidth: "400px", paddingTop: '50px' }}>
      <h2>Register</h2>
      {error && <p className="text-danger">{error}</p>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3"><Form.Label>Username</Form.Label><Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /></Form.Group>
        <Form.Group className="mb-3"><Form.Label>Password</Form.Label><Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Form.Group>
        <Form.Group className="mb-3"><Form.Label>Confirm Password</Form.Label><Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></Form.Group>
        <Button type="submit" variant="primary" disabled={authContextLoading}>Register</Button>
         <p className="mt-3">Already have an account? <Link to="/login">Login here</Link></p>
      </Form>
    </Container>
  );
}

// --- Main application component for budgets ---
function BudgetAppContent() {
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [viewExpensesModalBudgetId, setViewExpensesModalBudgetId] = useState();
  const [addExpenseModalBudgetId, setAddExpenseModalBudgetId] = useState();
  const [showFixedMonthlyTotalModal, setShowFixedMonthlyTotalModal] = useState(false);

  const { budgets, getBudgetExpenses } = useBudgets();
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  function openAddExpenseModal(budgetId) {
    setShowAddExpenseModal(true);
    setAddExpenseModalBudgetId(budgetId);
  }

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <>
      <Navbar bg="light" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">Budget App</Navbar.Brand>
          {currentUser && <Navbar.Text className="ms-2">Signed in as: <strong>{currentUser.username}</strong></Navbar.Text>}
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav>
              {currentUser && <Button variant="outline-secondary" onClick={handleLogout}>Logout</Button>}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="my-4">
        <Stack direction="horizontal" gap="2" className="mb-4">
          <h1 className="me-auto">Budgets</h1>
          <Button variant="outline-primary" onClick={() => setShowFixedMonthlyTotalModal(true)}>Set Monthly Cap</Button>
          <Button variant="primary" onClick={() => setShowAddBudgetModal(true)}>Add Budget</Button>
          <Button variant="outline-primary" onClick={() => openAddExpenseModal()}>Add Expense</Button>
        </Stack>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", alignItems: "flex-start" }}>
          { Array.isArray(budgets) && budgets.map((budget) => {
            const amount = getBudgetExpenses(budget.id).reduce((total, expense) => total + expense.amount, 0);
            return (<BudgetCard key={budget.id} budgetId={budget.id} name={budget.name} amount={amount} max={budget.max} onAddExpenseClick={() => openAddExpenseModal(budget.id)} onViewExpensesClick={() => setViewExpensesModalBudgetId(budget.id)} />);
          })}
          <UncategorizedBudgetCard onAddExpenseClick={() => openAddExpenseModal(UNCATEGORIZED_BUDGET_ID)} onViewExpensesClick={() => setViewExpensesModalBudgetId(UNCATEGORIZED_BUDGET_ID)} />
          <TotalBudgetCard />
        </div>
      </Container>
      <AddBudgetModal show={showAddBudgetModal} handleClose={() => setShowAddBudgetModal(false)} />
      <AddExpenseModal show={showAddExpenseModal} defaultBudgetId={addExpenseModalBudgetId} handleClose={() => setShowAddExpenseModal(false)} />
      <ViewExpensesModal budgetId={viewExpensesModalBudgetId} handleClose={() => setViewExpensesModalBudgetId()} />
      <AddFixedMonthlyTotalModal show={showFixedMonthlyTotalModal} handleClose={() => setShowFixedMonthlyTotalModal(false)} />
    </>
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

// --- Main App Component ---
function App() {
  // ---- START WebSocket Client MODIFIED ----
  useEffect(() => {
    const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    let wsHost;

    // Use REACT_APP_API_URL to derive the WebSocket host
    // This variable should be set during your build process for production
    const apiUrl = process.env.REACT_APP_API_URL;

    if (apiUrl && apiUrl.startsWith('http')) { // Check if apiUrl is a valid URL
      try {
        const urlObject = new URL(apiUrl);
        // For production, use the hostname from REACT_APP_API_URL (e.g., budget-api.technickservices.com)
        // For local, if REACT_APP_API_URL is like http://localhost:5000/api, use localhost:5000
        wsHost = urlObject.host; // This will include hostname:port if port is non-standard
        if (urlObject.protocol === 'http:' && wsProtocol === 'wss:') {
            // If API is http but site is https (local dev with proxy), adjust ws protocol if needed,
            // but usually you'd connect to the proxy's protocol for WebSockets too.
            // For simplicity here, we rely on wsProtocol derived from window.location.
        }
      } catch (e) {
        console.error("CLIENT WebSocket: Invalid REACT_APP_API_URL, falling back to default.", e);
        // Fallback for local development if REACT_APP_API_URL is not set or invalid
        wsHost = `localhost:${process.env.REACT_APP_SERVER_PORT || 5000}`;
      }
    } else if (process.env.NODE_ENV === 'production') {
        // Fallback for production if REACT_APP_API_URL is not available/valid
        wsHost = 'budget-api.technickservices.com';
        console.warn("CLIENT WebSocket: REACT_APP_API_URL not found or invalid, using default production host 'budget-api.technickservices.com'.");
    }
    else {
      // Fallback for local development
      wsHost = `localhost:${process.env.REACT_APP_SERVER_PORT || 5000}`;
      console.warn(`CLIENT WebSocket: REACT_APP_API_URL not found or invalid, using default development host '${wsHost}'.`);
    }

    const wsUrl = `${wsProtocol}${wsHost}/ws`;

    console.log(`CLIENT WebSocket: Attempting to connect to ${wsUrl}`); // Line 179 (approx)
    let socket;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("CLIENT WebSocket: Connected to server");
        socket.send("Hello Server from React Client!");
      };

      socket.onmessage = (event) => {
        console.log(`CLIENT WebSocket: Message from server: `, event.data);
      };

      socket.onerror = (error) => {
        console.error("CLIENT WebSocket: Connection Error Event:", error);
      };

      socket.onclose = (event) => {
        if (event.wasClean) {
          console.log(`CLIENT WebSocket: Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
          console.error(`CLIENT WebSocket: Connection died. Code: ${event.code}, Reason: "${event.reason}"`);
        }
      };
    } catch (error) {
      console.error("CLIENT WebSocket: Error initializing WebSocket:", error);
      return;
    }

    return () => {
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        console.log("CLIENT WebSocket: Closing connection on component unmount");
        socket.close(1000, "Client unmounting");
      }
    };
  }, []);
  // ---- END WebSocket Client MODIFIED ----

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
