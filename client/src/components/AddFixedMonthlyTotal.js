// client/src/components/AddFixedMonthlyTotal.js
import { Form, Modal, Button } from "react-bootstrap"; // Modal is imported
import { useRef } from "react";
import { useBudgets } from "../contexts/BudgetsContext";

export default function AddFixedMonthlyTotalModal({ show, handleClose }) { // Component name in export matches usage in App.js
  const { setMonthlyCapTotal, monthlyCap } = useBudgets();

  const amountRef = useRef();
  function handleSubmit(e) {
    e.preventDefault();
    // Ensure amountRef.current.value is treated as a string for parseFloat
    const value = amountRef.current.value;
    setMonthlyCapTotal(value); // Pass the string value, let context handle parsing
    handleClose();
  }

  // Determine placeholder: if monthlyCap is an array and has an item, use its cap.
  const placeholderCap = Array.isArray(monthlyCap) && monthlyCap.length > 0 && monthlyCap[0] && monthlyCap[0].cap !== undefined 
                         ? monthlyCap[0].cap 
                         : 0;

  return (
    <Modal show={show} onHide={handleClose}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Fixed Monthly Cap</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="amount">
            <Form.Label>Enter Fixed Monthly Cap</Form.Label>
            <Form.Control
              ref={amountRef}
              type="number"
              required
              min={0}
              step={0.01}
              defaultValue={placeholderCap} // Use defaultValue for uncontrolled input with ref or make it controlled
            />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button variant="primary" type="submit">
              Set Fixed Monthly Cap
            </Button>
          </div>
        </Modal.Body>
      </Form>
    </Modal>
  );
}
