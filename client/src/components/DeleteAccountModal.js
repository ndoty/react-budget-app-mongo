import { Form, Modal, Button, Alert } from "react-bootstrap";
import { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useBudgets } from "../contexts/BudgetsContext";

export default function DeleteAccountModal({ show, handleClose }) {
  const passwordRef = useRef();
  const [error, setError] = useState("");
  const { deleteAccount } = useAuth();
  // This correctly retrieves the exportData function from the context
  const { exportData } = useBudgets();

  const handleDelete = async () => {
    setError("");
    if (!passwordRef.current.value) {
      return setError("You must enter your password to confirm.");
    }

    const { success, message } = await deleteAccount(passwordRef.current.value);

    if (success) {
      alert("Your account has been permanently deleted.");
      handleClose();
    } else {
      setError(message);
    }
  };

  const onHide = () => {
    setError("");
    handleClose();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Delete Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="danger">
          <strong>Warning: This action is permanent!</strong>
          <hr />
          <p>
            Deleting your account will permanently erase your user profile, all budgets, expenses, and income records. This cannot be undone.
          </p>
          <p>
            We strongly recommend you export your data first.
          </p>
        </Alert>
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        <div className="d-grid gap-2">
            {/* The onClick handler is now correctly wired to the exportData function */}
            <Button variant="info" onClick={exportData}>
                Download My Data
            </Button>
        </div>
        <hr />
        <Form.Group className="mb-3" controlId="passwordConfirm">
          <Form.Label>Enter Your Password to Confirm Deletion</Form.Label>
          <Form.Control ref={passwordRef} type="password" required />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          Yes, Delete My Account Permanently
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
