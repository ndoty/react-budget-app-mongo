import { Form, Modal, Button, Alert } from "react-bootstrap";
import { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function ChangePasswordModal({ show, handleClose }) {
  const currentPasswordRef = useRef();
  const newPasswordRef = useRef();
  const confirmNewPasswordRef = useRef();
  const { changePassword } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPasswordRef.current.value !== confirmNewPasswordRef.current.value) {
      return setError("New passwords do not match.");
    }

    const { success, message: responseMessage } = await changePassword(
      currentPasswordRef.current.value,
      newPasswordRef.current.value
    );

    if (success) {
      setMessage(responseMessage);
      setTimeout(() => {
        handleClose();
        setMessage("");
      }, 2000); // Close modal after 2 seconds on success
    } else {
      setError(responseMessage);
    }
  };

  const onHide = () => {
    setError("");
    setMessage("");
    handleClose();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          <Form.Group className="mb-3" controlId="currentPassword">
            <Form.Label>Current Password</Form.Label>
            <Form.Control ref={currentPasswordRef} type="password" required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="newPassword">
            <Form.Label>New Password</Form.Label>
            <Form.Control ref={newPasswordRef} type="password" required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="confirmNewPassword">
            <Form.Label>Confirm New Password</Form.Label>
            <Form.Control ref={confirmNewPasswordRef} type="password" required />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button variant="primary" type="submit">
              Update Password
            </Button>
          </div>
        </Modal.Body>
      </Form>
    </Modal>
  );
}
