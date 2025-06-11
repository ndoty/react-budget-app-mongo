import { Modal, Button, Stack } from "react-bootstrap";
import { useBudgets } from "../contexts/BudgetsContext";
import { currencyFormatter } from "../utils";

export default function ViewIncomeModal({ show, handleClose, onEditIncomeClick }) {
  const { income, deleteIncome } = useBudgets();

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Income</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack direction="vertical" gap="3">
          {income.map(item => (
            <Stack direction="horizontal" gap="2" key={item.id}>
              <div className="me-auto fs-4">{item.description}</div>
              <div className="fs-5">{currencyFormatter.format(item.amount)}</div>
              <Button onClick={() => onEditIncomeClick(item.id)} size="sm" variant="outline-primary">
                Edit
              </Button>
              <Button
                onClick={() => deleteIncome({ id: item.id })}
                size="sm"
                variant="outline-danger"
              >
                &times;
              </Button>
            </Stack>
          ))}
        </Stack>
      </Modal.Body>
    </Modal>
  );
}
