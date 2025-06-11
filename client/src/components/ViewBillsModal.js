import { Modal, Button, Stack } from "react-bootstrap";
import { useBudgets } from "../contexts/BudgetsContext";
import { currencyFormatter } from "../utils";

export default function ViewBillsModal({ show, handleClose, onEditExpenseClick }) {
  const { getBillExpenses, deleteExpense } = useBudgets();

  const billExpenses = getBillExpenses();

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Recurring Bills</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack direction="vertical" gap="3">
          {billExpenses.map(expense => (
            <Stack direction="horizontal" gap="2" key={expense.id}>
              <div className="me-auto fs-4">{expense.description}</div>
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
