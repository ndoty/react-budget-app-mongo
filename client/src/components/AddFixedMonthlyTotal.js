import { Form, Modal, Button } from "react-bootstrap"
import { useRef } from "react"
import { useBudgets } from "../contexts/BudgetsContext"

export default function AddFixedMonthlyTotalModal({ show, handleClose }) {
  const { setMonthlyCapTotal, monthlyCap } = useBudgets()

  const amountRef = useRef()
  function handleSubmit(e) {
    e.preventDefault()
    setMonthlyCapTotal(amountRef.current.value !== 0 ? amountRef.current.value : null )
    handleClose()
  }

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
              placeholder={monthlyCap.length > 0 ? monthlyCap[0].cap : 0}
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
  )
}
