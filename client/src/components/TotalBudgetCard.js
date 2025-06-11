import { Card, Stack } from "react-bootstrap";
import { currencyFormatter } from "../utils";
import { useBudgets } from "../contexts/BudgetsContext";

export default function TotalBudgetCard() {
  const { expenses, income, budgets, getBudgetExpenses, UNCATEGORIZED_BUDGET_ID } = useBudgets();

  // 1. Calculate Total Income
  const totalIncome = income.reduce(
    (total, item) => total + item.amount, 0
  );

  // 2. Calculate the "effective spend" for all categorized budgets
  const totalObligationFromBudgets = budgets.reduce((total, budget) => {
    const spentInBudget = getBudgetExpenses(budget.id).reduce(
      (sum, expense) => sum + expense.amount, 0
    );
    // For each budget, the amount to account for is the greater of what was spent or what was budgeted
    const effectiveSpend = Math.max(spentInBudget, budget.max);
    return total + effectiveSpend;
  }, 0);

  // 3. Calculate spending for the "Uncategorized" budget (this always counts as spent)
  const uncategorizedSpent = getBudgetExpenses(UNCATEGORIZED_BUDGET_ID).reduce(
    (total, expense) => total + expense.amount, 0
  );

  // 4. The final amount to subtract from income
  const totalAmountToSubtract = totalObligationFromBudgets + uncategorizedSpent;

  // 5. The final balance
  const balance = totalIncome - totalAmountToSubtract;

  // Determine card style based on the final balance
  const cardStyle = {};
  if (balance < 0) {
    cardStyle.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    cardStyle.borderColor = 'rgba(255, 0, 0, 0.2)';
  } else {
    cardStyle.backgroundColor = 'rgba(0, 255, 0, 0.1)';
    cardStyle.borderColor = 'rgba(0, 255, 0, 0.2)';
  }

  // Do not render the card if there is no activity at all
  if (totalIncome === 0 && totalAmountToSubtract === 0) {
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
                <span>Total Obligations (Spent/Budgeted):</span>
                <span className="text-danger">
                  - {currencyFormatter.format(totalAmountToSubtract)}
                </span>
            </div>
        </Stack>
      </Card.Body>
    </Card>
  );
}
