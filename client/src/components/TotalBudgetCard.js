import { Card, Stack } from "react-bootstrap";
import { currencyFormatter } from "../utils";
import { useBudgets } from "../contexts/BudgetsContext";

export default function TotalBudgetCard() {
  const { expenses, income } = useBudgets();

  // Calculate total expenses and total income
  const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
  const totalIncome = income.reduce((total, item) => total + item.amount, 0);

  // Calculate the final balance
  const balance = totalIncome - totalExpenses;

  // Determine the card style based on whether the balance is positive or negative
  const cardStyle = {};
  if (balance < 0) {
    // Apply a light red style for a negative balance
    cardStyle.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    cardStyle.borderColor = 'rgba(255, 0, 0, 0.2)';
  } else {
    // Apply a light green style for a positive or zero balance
    cardStyle.backgroundColor = 'rgba(0, 255, 0, 0.1)';
    cardStyle.borderColor = 'rgba(0, 255, 0, 0.2)';
  }

  // Do not render the card at all if there has been no financial activity
  if (totalIncome === 0 && totalExpenses === 0) {
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
            <div className="d-flex justify-content-between">
                <span>Total Expenses:</span>
                <span style={{color: "red"}}>{currencyFormatter.format(totalExpenses)}</span>
            </div>
        </Stack>
      </Card.Body>
    </Card>
  );
}
