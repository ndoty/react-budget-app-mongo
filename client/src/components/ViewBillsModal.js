import { Modal, Button, Stack } from "react-bootstrap";
import { useBudgets } from "../contexts/BudgetsContext";
import { currencyFormatter } from "../utils";

export default function ViewBillsModal({ show, handleClose, onEditExpenseClick }) {
  const { expenses, getBudget, deleteExpense } = useBudgets();

  // Filter to get only the expenses that are bills
  const billExpenses = expenses.filter(expense => expense.isBill);

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Recurring Bills</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack direction="vertical" gap="3">
          {billExpenses.map(expense => {
            // Find the budget name for display, or show "Uncategorized"
            const budget = getBudget(expense.budgetId);
            return (
              <Stack direction="horizontal" gap="2" key={expense.id}>
                <div className="me-auto">
                    <div className="fs-4">{expense.description}</div>
                    <div className="text-muted fs-6">{budget?.name || 'Uncategorized'}</div>
                </div>
                <div className="fs-5">{currencyFormatter.format(expense.amount)}</div>
                <Button onClick={() => onEditExpenseClick(expense.id)} size="sm" variant="outline-primary">
                  Edit
                </Button>
                <Button
                  onClick={() => deleteExpense({ id: expense.id })}
                  size="sm"
                  variant="outline-danger"
                >
                  &times;
                </Button>
              </Stack>
            );
          })}
        </Stack>
      </Modal.Body>
    </Modal>
  );
}
