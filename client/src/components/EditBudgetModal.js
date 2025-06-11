import { Form, Modal, Button } from "react-bootstrap";
import { useRef, useEffect } from "react";
import { useBudgets } from "../contexts/BudgetsContext";

export default function EditBudgetModal({ show, handleClose, budgetId }) {
  const nameRef = useRef();
  const maxRef = useRef();
  
  // MODIFIED: Destructure deleteBudget from useBudgets
  const { updateBudget, deleteBudget, getBudget } = useBudgets();
  const budget = getBudget(budgetId);

  useEffect(() => {
    if (budget) {
      nameRef.current.value = budget.name;
      maxRef.current.value = budget.max;
    }
  }, [budget]);

  function handleSubmit(e) {
    e.preventDefault();
    updateBudget({
      id: budgetId,
      name: nameRef.current.value,
      max: parseFloat(maxRef.current.value),
    });
    handleClose();
  }

  // MODIFIED: Create a handler for the delete action
  async function handleDelete() {
    if (budget) {
      await deleteBudget({ id: budget.id });
      handleClose();
    }
  }

  return (
    <Modal show={show} onHide={handleClose}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Budget</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="name">
            <Form.Label>Name</Form.Label>
            <Form.Control ref={nameRef} type="text" required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="max">
            <Form.Label>Maximum Spending</Form.Label>
            <Form.Control
              ref={maxRef}
              type="number"
              required
              min={0}
              step={0.01}
            />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </Modal.Body>
        {/* MODIFIED: Added a modal footer for the delete button */}
        <Modal.Footer>
          <Button variant="outline-danger" onClick={handleDelete} className="me-auto">
            Delete Budget
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
