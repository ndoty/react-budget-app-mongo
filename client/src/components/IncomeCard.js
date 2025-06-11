import { Button, Card, Stack } from "react-bootstrap";
import { currencyFormatter } from "../utils";
import { useBudgets } from "../contexts/BudgetsContext";

export default function IncomeCard() {
  const { income, deleteIncome } = useBudgets();
  const totalIncome = income.reduce((total, i) => total + i.amount, 0);

  if (totalIncome === 0) {
    return null;
  }

  return (
    <Card className="bg-success bg-opacity-10">
      <Card.Body>
        <Card.Title className="d-flex justify-content-between align-items-baseline fw-normal mb-3">
          <div className="me-2">Income</div>
          <div className="d-flex align-items-baseline">
            {currencyFormatter.format(totalIncome)}
          </div>
        </Card.Title>
        <Stack direction="vertical" gap="3" className="mt-4">
          {income.map(item => (
            <Stack direction="horizontal" gap="2" key={item.id}>
              <div className="me-auto fs-5">{item.description}</div>
              <div className="fs-5">{currencyFormatter.format(item.amount)}</div>
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
      </Card.Body>
    </Card>
  );
}
