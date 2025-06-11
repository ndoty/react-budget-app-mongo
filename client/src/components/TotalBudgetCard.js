import { Button, Card, Stack } from "react-bootstrap";
import { currencyFormatter } from "../utils";
import { useBudgets } from "../contexts/BudgetsContext";

// MODIFIED: Added onViewIncomeClick prop
export default function TotalBudgetCard({ onViewIncomeClick }) {
  const { expenses, income, budgets, getBudgetExpenses, UNCATEGORIZED_BUDGET_ID } = useBudgets();

  // --- Calculations (no changes here) ---
  const totalIncome = income.reduce((total, item) => total + item.amount, 0);
  const totalObligationFromBudgets = budgets.reduce((total, budget) => {
    const spentInBudget = getBudgetExpenses(budget.id).reduce((sum, expense) => sum + expense.amount, 0);
    return total + Math.max(spentInBudget, budget.max);
  }, 0);
  const uncategorizedSpent = getBudgetExpenses(UNCATEGORIZED_BUDGET_ID).reduce((total, expense) => total + expense.amount, 0);
  const totalAmountToSubtract = totalObligationFromBudgets + uncategorizedSpent;
  const balance = totalIncome - totalAmountToSubtract;

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
  if (totalIncome === 0 && totalAmountToSubtract === 0) {
    // Also show the card if there are budgets, so the user can see their plan
    if (budgets.length === 0) return null;
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
        {/* MODIFIED: Updated the breakdown display */}
        <Stack direction="vertical" gap="2" className="mt-2">
            <div className="d-flex justify-content-between">
                <span>Total Income:</span>
                <span className="text-success">+{currencyFormatter.format(totalIncome)}</span>
            </div>
            <div className="d-flex justify-content-between">
                <span>Total Budgeted:</span>
                <span>{currencyFormatter.format(budgets.reduce((total, budget) => total + budget.max, 0))}</span>
            </div>
            <div className="d-flex justify-content-between">
                <span>Total Spent:</span>
                <span className="text-danger">
                  - {currencyFormatter.format(expenses.reduce((total, expense) => total + expense.amount, 0))}
                </span>
            </div>
        </Stack>
        {/* MODIFIED: Added a button to view income details */}
        <Stack direction="horizontal" gap="2" className="mt-4">
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
