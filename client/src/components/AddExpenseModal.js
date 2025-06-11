import { Form, Modal, Button } from "react-bootstrap";
import { useRef, useState } from "react";
import { useBudgets, UNCATEGORIZED_BUDGET_ID, BILLS_BUDGET_ID } from "../contexts/BudgetsContext";

export default function AddExpenseModal({
  show,
  handleClose,
  defaultBudgetId,
}) {
  const descriptionRef = useRef();
  const amountRef = useRef();
  const budgetIdRef = useRef();
  const dueDateRef = useRef();
  const { addExpense, budgets } = useBudgets();
  const [isBill, setIsBill] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    
    const expenseBudgetId = isBill ? BILLS_BUDGET_ID : budgetIdRef.current.value;

    addExpense({
      description: descriptionRef.current.value,
      amount: parseFloat(amountRef.current.value),
      budgetId: expenseBudgetId,
      isBill: isBill,
      dueDate: isBill ? parseInt(dueDateRef.current.value) : null,
    });
    handleClose();
  }

  const handleModalClose = () => {
    setIsBill(false);
    handleClose();
  }

  return (
    <Modal show={show} onHide={handleModalClose}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>New Expense</Modal.Title>
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
          <Form.Group className="mb-3" controlId="isBill">
            <Form.Check
              type="checkbox"
              checked={isBill}
              onChange={(e) => setIsBill(e.target.checked)}
              label="Is this a recurring bill?"
            />
          </Form.Group>
          
          {isBill && (
            <Form.Group className="mb-3" controlId="dueDate">
              <Form.Label>Due Date (Day of Month)</Form.Label>
              {/* MODIFIED: Reverted input to type="number" */}
              <Form.Control
                ref={dueDateRef}
                type="number"
                required
                min={1}
                max={31}
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3" controlId="budgetId">
            <Form.Label>Budget</Form.Label>
            <Form.Select defaultValue={defaultBudgetId} ref={budgetIdRef} disabled={isBill}>
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
              Add
            </Button>
          </div>
        </Modal.Body>
      </Form>
    </Modal>
  );
}
