import { Card, Stack } from "react-bootstrap";
import { currencyFormatter } from "../utils";
import { useBudgets } from "../contexts/BudgetsContext";

export default function TotalBudgetCard() {
  const { expenses, income, budgets } = useBudgets();

  // 1. Calculate all the totals
  const totalExpenses = expenses.reduce(
    (total, expense) => total + expense.amount, 0
  );
  const totalIncome = income.reduce(
    (total, item) => total + item.amount, 0
  );
  const totalBudgetMax = budgets.reduce(
    (total, budget) => total + budget.max, 0
  );

  // 2. Determine the amount to subtract based on your logic
  // Use the actual expenses or the total budgeted amount, whichever is higher.
  const amountToSubtract = Math.max(totalExpenses, totalBudgetMax);

  // 3. Calculate the final balance
  const balance = totalIncome - amountToSubtract;

  // Determine card style based on whether the final balance is positive or negative
  const cardStyle = {};
  if (balance < 0) {
    cardStyle.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    cardStyle.borderColor = 'rgba(255, 0, 0, 0.2)';
  } else {
    cardStyle.backgroundColor = 'rgba(0, 255, 0, 0.1)';
    cardStyle.borderColor = 'rgba(0, 255, 0, 0.2)';
  }

  // Do not render the card if there is no financial activity at all
  if (totalIncome === 0 && totalExpenses === 0 && totalBudgetMax === 0) {
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
        <Stack direction="vertical" gap="2" className="mt-4">
            <div className="d-flex justify-content-between">
                <span>Total Income:</span>
                <span style={{color: "green"}}>{currencyFormatter.format(totalIncome)}</span>
            </div>
            {/* Display the value that is being subtracted (the higher of spent or budgeted) */}
            <div className="d-flex justify-content-between">
                <span>Budgeted/Spent:</span>
                <span style={{color: "red"}}>- {currencyFormatter.format(amountToSubtract)}</span>
            </div>
        </Stack>
      </Card.Body>
    </Card>
  );
}
