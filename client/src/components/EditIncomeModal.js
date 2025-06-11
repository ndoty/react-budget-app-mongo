import { Form, Modal, Button } from "react-bootstrap";
import { useRef, useEffect } from "react";
import { useBudgets } from "../contexts/BudgetsContext";

export default function EditIncomeModal({ show, handleClose, incomeId }) {
  const descriptionRef = useRef();
  const amountRef = useRef();
  const { updateIncome, getIncomeItem } = useBudgets();
  const incomeItem = getIncomeItem(incomeId);

  useEffect(() => {
    if (incomeItem) {
      descriptionRef.current.value = incomeItem.description;
      amountRef.current.value = incomeItem.amount;
    }
  }, [incomeItem]);

  function handleSubmit(e) {
    e.preventDefault();
    updateIncome({
      id: incomeId,
      description: descriptionRef.current.value,
      amount: parseFloat(amountRef.current.value),
    });
    handleClose();
  }

  return (
    <Modal show={show} onHide={handleClose}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Income</Modal.Title>
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
