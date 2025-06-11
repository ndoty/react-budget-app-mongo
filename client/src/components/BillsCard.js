import { Button, Card, Stack } from "react-bootstrap";
import { currencyFormatter } from "../utils";
import { useBudgets, BILLS_BUDGET_ID } from "../contexts/BudgetsContext";

export default function BillsCard(props) {
  const { getBudgetExpenses } = useBudgets();
  
  // Get all expenses assigned to the "Bills" category
  const billsExpenses = getBudgetExpenses(BILLS_BUDGET_ID);
  const amount = billsExpenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  if (amount === 0) {
    return null; // Don't show the card if there are no bills
  }

  return (
    // Using a different color to distinguish from regular budgets
    <Card className="bg-info bg-opacity-10">
      <Card.Body>
        <Card.Title className="d-flex justify-content-between align-items-baseline fw-normal mb-3">
          <div className="me-2">Bills</div>
          <div className="d-flex align-items-baseline">
            {currencyFormatter.format(amount)}
          </div>
        </Card.Title>
        <Stack direction="horizontal" gap="2" className="mt-4">
          <Button
            variant="outline-secondary"
            className="ms-auto"
            onClick={props.onViewExpensesClick}
          >
            View Expenses
          </Button>
        </Stack>
      </Card.Body>
    </Card>
  );
}
