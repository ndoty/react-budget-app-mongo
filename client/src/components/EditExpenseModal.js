// client/src/components/EditExpenseModal.js
import { Form, Modal, Button } from "react-bootstrap";
import { useRef, useEffect } from "react";
import { useBudgets, UNCATEGORIZED_BUDGET_ID, BILLS_BUDGET_ID } from "../contexts/BudgetsContext";

export default function EditExpenseModal({ show, handleClose, expenseId }) {
  const descriptionRef = useRef();
  const amountRef = useRef();
  const budgetIdRef = useRef();
  const { updateExpense, getExpense, budgets } = useBudgets();
  const expense = getExpense(expenseId);

  useEffect(() => {
    if (expense) {
      descriptionRef.current.value = expense.description;
      amountRef.current.value = expense.amount;
      budgetIdRef.current.value = expense.budgetId;
    }
  }, [expense]);

  function handleSubmit(e) {
    e.preventDefault();
    updateExpense({
      id: expenseId,
      description: descriptionRef.current.value,
      amount: parseFloat(amountRef.current.value),
      budgetId: budgetIdRef.current.value,
    });
    handleClose();
  }

  return (
    <Modal show={show} onHide={handleClose}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="description">
            <Form.Label>Description</Form.Label>
            <Form.Control ref={descriptionRef} type="text" required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="amount">
            <Form.Label>Amount</Form.Label>
            <Form.Control
              ref={amountRef}
              type="number"
              required
              min={0}
              step={0.01}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="budgetId">
            <Form.Label>Budget</Form.Label>
            <Form.Select defaultValue={expense?.budgetId} ref={budgetIdRef}>
              <option value={BILLS_BUDGET_ID}>Bills</option>
              <option value={UNCATEGORIZED_BUDGET_ID}>Uncategorized</option>
              {budgets.map(budget => (
                <option key={budget.id} value={budget.id}>
                  {budget.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </Modal.Body>
      </Form>
    </Modal>
  );
}
