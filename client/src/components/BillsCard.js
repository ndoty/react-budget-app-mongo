import { Button, Card, Stack } from "react-bootstrap";
import { currencyFormatter } from "../utils";
import { useBudgets } from "../contexts/BudgetsContext";

export default function BillsCard({ onViewExpensesClick }) {
  const { expenses } = useBudgets();

  // Filter all expenses to find only the ones marked as a bill
  const billsTotal = expenses
    .filter(expense => expense.isBill)
    .reduce((total, expense) => total + expense.amount, 0);

  // Don't show the card if there are no expenses marked as bills
  if (billsTotal === 0) {
    return null;
  }

  return (
    <Card className="bg-info bg-opacity-10">
      <Card.Body>
        <Card.Title className="d-flex justify-content-between align-items-baseline fw-normal mb-3">
          <div className="me-2">Recurring Bills</div>
          <div className="d-flex align-items-baseline">
            {currencyFormatter.format(billsTotal)}
          </div>
        </Card.Title>
        <Stack direction="horizontal" gap="2" className="mt-4">
          <Button
            variant="outline-secondary"
            className="ms-auto"
            onClick={onViewExpensesClick}
          >
            View Expenses
          </Button>
        </Stack>
      </Card.Body>
    </Card>
  );
}
