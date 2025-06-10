import { Form, Modal, Button } from "react-bootstrap";
import { useRef, useEffect } from "react";
import { useBudgets } from "../contexts/BudgetsContext";

export default function EditBudgetModal({ show, handleClose, budgetId }) {
  const nameRef = useRef();
  const maxRef = useRef();
  const { updateBudget, getBudget } = useBudgets();
  const budget = getBudget(budgetId);

  // Set form values when budget object is available
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
      </Form>
    </Modal>
  );
}
