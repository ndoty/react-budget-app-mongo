import { Form, Modal, Button } from "react-bootstrap";
import { useRef, useEffect, useState } from "react";
import { useBudgets, UNCATEGORIZED_BUDGET_ID, BILLS_BUDGET_ID } from "../contexts/BudgetsContext";

export default function EditExpenseModal({ show, handleClose, expenseId }) {
  const descriptionRef = useRef();
  const amountRef = useRef();
  const budgetIdRef = useRef();
  const { updateExpense, getExpense, budgets } = useBudgets();
  const expense = getExpense(expenseId);
  const [isBill, setIsBill] = useState(false);

  useEffect(() => {
    if (expense) {
      descriptionRef.current.value = expense.description;
      amountRef.current.value = expense.amount;
      budgetIdRef.current.value = expense.budgetId;
      setIsBill(expense.isBill || false);
    }
  }, [expense]);

  function handleSubmit(e) {
    e.preventDefault();

    const expenseBudgetId = isBill ? BILLS_BUDGET_ID : budgetIdRef.current.value;

    updateExpense({
      id: expenseId,
      description: descriptionRef.current.value,
      amount: parseFloat(amountRef.current.value),
      budgetId: expenseBudgetId,
      isBill: isBill,
    });
    handleClose();
  }
  
  // Custom close handler to reset local state
  const handleModalClose = () => {
    setIsBill(false);
    handleClose();
  }

  return (
    <Modal show={show} onHide={handleModalClose}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="description">
            <Form.Label>Description</Form.Label>
            <Form.Control ref={descriptionRef} type="text" required defaultValue={expense?.description} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="amount">
            <Form.Label>Amount</Form.Label>
            <Form.Control
              ref={amountRef}
              type="number"
              required
              min={0}
              step={0.01}
              defaultValue={expense?.amount}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="isBill">
            <Form.Check
              type="checkbox"
              checked={isBill}
              onChange={(e) => setIsBill(e.target.checked)}
              label="Is this a recurring bill?"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="budgetId">
            <Form.Label>Budget</Form.Label>
            <Form.Select ref={budgetIdRef} defaultValue={expense?.budgetId} disabled={isBill}>
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
