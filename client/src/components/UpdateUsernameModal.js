import React, { useState } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

export default function UpdateUsernameModal({ show, handleClose }) {
  const [newUsername, setNewUsername] = useState("");
  const [error, setError] = useState("");
  const { updateUsername } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { success, message } = await updateUsername(newUsername);
    if (success) {
      handleClose();
    } else {
      setError(message);
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Update Your Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          To enable password resets and improve account security, please update
          your username to a valid email address.
        </p>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label>New Email Address</Form.Label>
            <Form.Control
              type="email"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          </Form.Group>
          <Button className="w-100 mt-3" type="submit">
            Update and Continue
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}