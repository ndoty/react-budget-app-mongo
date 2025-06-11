import { Form, Modal, Button } from "react-bootstrap";
import { useRef } from "react";
import { useBudgets, UNCATEGORIZED_BUDGET_ID } from "../contexts/BudgetsContext";

export default function MoveExpenseModal({ show, handleClose, expenseId }) {
  const budgetIdRef = useRef();
  const { updateExpense, budgets } = useBudgets();

  function handleSubmit(e) {
    e.preventDefault();
    const newBudgetId = budgetIdRef.current.value;

    // We don't want to move it to the same "Uncategorized" category
    if (newBudgetId === UNCATEGORIZED_BUDGET_ID) return handleClose();

    updateExpense({
      id: expenseId,
      budgetId: newBudgetId,
    });
    handleClose();
  }

  // Exclude the "Uncategorized" budget from the list of choices
  const availableBudgets = budgets.filter(b => b.id !== UNCATEGORIZED_BUDGET_ID);

  return (
    <Modal show={show} onHide={handleClose}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Move Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="budgetId">
            <Form.Label>Move to Budget</Form.Label>
            <Form.Select ref={budgetIdRef} required>
              {availableBudgets.map(budget => (
                <option key={budget.id} value={budget.id}>
                  {budget.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button variant="primary" type="submit">
              Move
            </Button>
          </div>
        </Modal.Body>
      </Form>
    </Modal>
  );
}
