import { Modal, Button, Stack } from "react-bootstrap";
import { useBudgets } from "../contexts/BudgetsContext";
import { currencyFormatter } from "../utils";

// Add the new onAddBillClick prop
export default function ViewBillsModal({ show, handleClose, onEditExpenseClick, onAddBillClick }) {
  const { getBillExpenses, deleteExpense } = useBudgets();

  const billExpenses = getBillExpenses();
  const sortedBillExpenses = [...billExpenses].sort((a, b) => {
    if (a.dueDate < b.dueDate) return -1;
    if (a.dueDate > b.dueDate) return 1;
    return a.description.localeCompare(b.description);
  });

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          <Stack direction="horizontal" gap="3">
            <div>Recurring Bills</div>
            {/* This new button will open the Add Expense modal in "bill mode" */}
            <Button variant="primary" size="sm" onClick={onAddBillClick}>
              Add Bill
            </Button>
          </Stack>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack direction="vertical" gap="3">
          {sortedBillExpenses.map(expense => (
            <Stack direction="horizontal" gap="2" key={expense.id}>
              <div className="me-auto">
                  <div className="fs-4">{expense.description}</div>
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