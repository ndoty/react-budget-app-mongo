import { Button, Card, Stack } from "react-bootstrap";
import { currencyFormatter } from "../utils";
import { useBudgets } from "../contexts/BudgetsContext";

export default function TotalBudgetCard({ onViewIncomeClick, onViewBillsClick }) {
  const { expenses, income, budgets, getBillExpenses } = useBudgets();

  // --- Calculations ---
  const allExpenses = expenses || [];
  const allBudgets = budgets || [];
  const totalIncome = (income || []).reduce((total, item) => total + item.amount, 0);

  // Calculate the total obligation from your defined budgets
  const totalBudgetObligation = allBudgets.reduce((total, budget) => {
    const expensesForBudget = allExpenses.filter(e => e.budgetId === budget.id);
    const amountSpent = expensesForBudget.reduce((t, e) => t + e.amount, 0);
    // Use the amount spent if over budget, otherwise use the max planned amount
    const obligation = amountSpent > budget.max ? amountSpent : budget.max;
    return total + obligation;
  }, 0);

  // Calculate spending that is not part of any user-created budget (i.e., Bills and Uncategorized)
  const budgetIds = allBudgets.map(b => b.id);
  const nonBudgetedExpenses = allExpenses.filter(e => !budgetIds.includes(e.budgetId));
  const totalNonBudgetedSpending = nonBudgetedExpenses.reduce((total, e) => total + e.amount, 0);

  // The new balance calculation based on your rules
  const balance = totalIncome - totalBudgetObligation - totalNonBudgetedSpending;

  // --- Display values (for the breakdown) ---
  const totalExpensesDisplay = allExpenses.reduce((total, expense) => total + expense.amount, 0);
  const totalBillsDisplay = (getBillExpenses() || []).reduce((total, expense) => total + expense.amount, 0);
  const totalBudgetMaxDisplay = allBudgets.reduce((total, budget) => total + budget.max, 0);


  // --- Card Styling ---
  const cardStyle = {};
  if (balance < 0) {
    cardStyle.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    cardStyle.borderColor = 'rgba(255, 0, 0, 0.2)';
  } else {
    cardStyle.backgroundColor = 'rgba(0, 255, 0, 0.1)';
    cardStyle.borderColor = 'rgba(0, 255, 0, 0.2)';
  }

  // --- Render Logic ---
  if (totalIncome === 0 && totalExpensesDisplay === 0 && allBudgets.length === 0) {
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
        <Stack direction="vertical" gap="2" className="mt-2">
            <div className="d-flex justify-content-between">
                <span>Total Income:</span>
                <span className="text-success">+{currencyFormatter.format(totalIncome)}</span>
            </div>
            <div className="d-flex justify-content-between">
                <span>Total Budgeted:</span>
                <span className="text-danger">
                  - {currencyFormatter.format(totalBudgetMaxDisplay)}
                </span>
            </div>
            <div className="d-flex justify-content-between">
                <span>Total Bills:</span>
                <span className="text-danger">
                  - {currencyFormatter.format(totalBillsDisplay)}
                </span>
            </div>
            <div className="d-flex justify-content-between">
                <span>Total Spent:</span>
                <span className="text-danger">
                  - {currencyFormatter.format(totalExpensesDisplay)}
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
