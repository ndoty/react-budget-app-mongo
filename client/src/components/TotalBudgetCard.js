import { Button, Card, Stack } from "react-bootstrap";
import { currencyFormatter } from "../utils";
import { useBudgets } from "../contexts/BudgetsContext";

export default function TotalBudgetCard({ onViewIncomeClick, onViewBillsClick }) {
  const { expenses, income, budgets, getBillExpenses } = useBudgets();

  // --- Calculations ---
  const totalIncome = (income || []).reduce((total, item) => total + item.amount, 0);
  const totalExpenses = (expenses || []).reduce((total, expense) => total + expense.amount, 0);
  const totalBills = (getBillExpenses() || []).reduce((total, expense) => total + expense.amount, 0);
  const totalBudgetMax = (budgets || []).reduce((total, budget) => total + budget.max, 0);
  
  // The Overall Balance is your total income minus your total spending.
  const balance = totalIncome - totalExpenses;

  // --- Card Styling (no changes here) ---
  const cardStyle = {};
  if (balance < 0) {
    cardStyle.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    cardStyle.borderColor = 'rgba(255, 0, 0, 0.2)';
  } else {
    cardStyle.backgroundColor = 'rgba(0, 255, 0, 0.1)';
    cardStyle.borderColor = 'rgba(0, 255, 0, 0.2)';
  }

  // --- Render Logic ---
  if (totalIncome === 0 && totalExpenses === 0 && (budgets || []).length === 0) {
    return null;
  }

  return (
    <Card style={cardStyle}>
      <Card.Body>
        <Card.Title className="d-flex justify-content-between align-items-baseline fw-normal mb-3">
          <div className="me-2">Overall Balance</div>
          <div className="d-flex align-items-baseline" style={{ color: balance < 0 ? 'red' : 'green' }}>
            {currencyFormatter.format(balance)}
          </div>
        </Card.Title>
        <hr />
        {/* This breakdown provides the detailed view of your finances */}
        <Stack direction="vertical" gap="2" className="mt-2">
            <div className="d-flex justify-content-between">
                <span>Total Income:</span>
                <span className="text-success">+{currencyFormatter.format(totalIncome)}</span>
            </div>
            <div className="d-flex justify-content-between">
                <span>Total Budgeted:</span>
                <span>{currencyFormatter.format(totalBudgetMax)}</span>
            </div>
            <div className="d-flex justify-content-between">
                <span>Total Bills:</span>
                <span className="text-danger">
                  - {currencyFormatter.format(totalBills)}
                </span>
            </div>
            <div className="d-flex justify-content-between">
                <span>Total Spent:</span>
                <span className="text-danger">
                  - {currencyFormatter.format(totalExpenses)}
                </span>
            </div>
        </Stack>
        <Stack direction="horizontal" gap="2" className="mt-4">
          <Button
            variant="outline-danger"
            onClick={onViewBillsClick}
          >
            View Bills
          </Button>
          <Button
            variant="outline-success"
            className="ms-auto"
            onClick={onViewIncomeClick}
          >
            View Income
          </Button>
        </Stack>
      </Card.Body>
    </Card>
  );
}
