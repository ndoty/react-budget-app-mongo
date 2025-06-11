import { Modal, Button, Stack } from "react-bootstrap";
import { useBudgets } from "../contexts/BudgetsContext";
import { currencyFormatter } from "../utils";

export default function ViewBillsModal({ show, handleClose, onEditExpenseClick }) {
  const { getBillExpenses, deleteExpense } = useBudgets();

  const billExpenses = getBillExpenses();
  
  // MODIFIED: Revert sorting logic to a simple numeric sort on the dueDate
  const sortedBillExpenses = [...billExpenses].sort((a, b) => {
    if (a.dueDate < b.dueDate) return -1;
    if (a.dueDate > b.dueDate) return 1;
    return a.description.localeCompare(b.description);
  });

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Recurring Bills</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack direction="vertical" gap="3">
          {sortedBillExpenses.map(expense => (
            <Stack direction="horizontal" gap="2" key={expense.id}>
              <div className="me-auto">
                  <div className="fs-4">{expense.description}</div>
                  {/* MODIFIED: Revert display to show the day of the month */}
                  {expense.dueDate && (
                    <div className="text-muted fs-6">Due on day: {expense.dueDate}</div>
                  )}
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
          ))}
        </Stack>
      </Modal.Body>
    </Modal>
  );
}
