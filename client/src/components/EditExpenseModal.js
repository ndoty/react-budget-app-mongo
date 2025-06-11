import { Form, Modal, Button } from "react-bootstrap";
import { useRef, useEffect } from "react";
import { useBudgets } from "../contexts/BudgetsContext";

export default function EditExpenseModal({ show, handleClose, expenseId }) {
  const descriptionRef = useRef();
  const amountRef = useRef();
  const budgetIdRef = useRef();
  const isBillRef = useRef(); // MODIFIED: Add ref for the checkbox
  const { updateExpense, getExpense, budgets } = useBudgets();
  const expense = getExpense(expenseId);

  useEffect(() => {
    if (expense) {
      descriptionRef.current.value = expense.description;
      amountRef.current.value = expense.amount;
      budgetIdRef.current.value = expense.budgetId;
      // MODIFIED: Set the checkbox state
      if (isBillRef.current) {
        isBillRef.current.checked = expense.isBill || false;
      }
    }
  }, [expense]);

  function handleSubmit(e) {
    e.preventDefault();
    updateExpense({
      id: expenseId,
      description: descriptionRef.current.value,
      amount: parseFloat(amountRef.current.value),
      budgetId: budgetIdRef.current.value,
      isBill: isBillRef.current.checked, // MODIFIED: Pass the checkbox value
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
            <Form.Select ref={budgetIdRef}>
              {budgets.map(budget => (
                <option key={budget.id} value={budget.id}>
                  {budget.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          {/* MODIFIED: Add checkbox for marking as a bill */}
          <Form.Group className="mb-3" controlId="isBill">
            <Form.Check
              type="checkbox"
              ref={isBillRef}
              label="Is this a recurring bill?"
              defaultChecked={expense?.isBill || false}
            />
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
