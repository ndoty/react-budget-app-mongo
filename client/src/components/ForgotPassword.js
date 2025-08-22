import React, { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const { success, message: responseMessage } = await forgotPassword(username);
    if (success) {
      setMessage(responseMessage);
    } else {
      setError(responseMessage);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <h2 className="text-center mb-4">Forgot Password</h2>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group id="username">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </Form.Group>
          <Button className="w-100 mt-3" type="submit">
            Reset Password
          </Button>
        </Form>
        <div className="w-100 text-center mt-2">
          <Link to="/login">Login</Link>
        </div>
      </div>
    </Container>
  );
}