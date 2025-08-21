import React, { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    setMessage('');
    setError('');
    const { success, message: responseMessage } = await resetPassword(token, password);
    if (success) {
      setMessage(responseMessage);
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setError(responseMessage);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <h2 className="text-center mb-4">Reset Password</h2>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group id="password">
            <Form.Label>New Password</Form.Label>
            <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Form.Group>
          <Form.Group id="confirm-password">
            <Form.Label>Confirm New Password</Form.Label>
            <Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </Form.Group>
          <Button className="w-100 mt-3" type="submit">
            Reset Password
          </Button>
        </Form>
      </div>
    </Container>
  );
}