import { Button, Card, Stack } from "react-bootstrap";
import { currencyFormatter } from "../utils";
import { useBudgets } from "../contexts/BudgetsContext";

export default function IncomeCard({ onViewIncomeClick }) { // MODIFIED: Added onViewIncomeClick prop
  const { income } = useBudgets();
  const totalIncome = income.reduce((total, i) => total + i.amount, 0);

  return (
    <Card className="bg-success bg-opacity-10">
      <Card.Body>
        <Card.Title className="d-flex justify-content-between align-items-baseline fw-normal mb-3">
          <div className="me-2">Total Income</div>
          <div className="d-flex align-items-baseline text-success">
            {currencyFormatter.format(totalIncome)}
          </div>
        </Card.Title>
        {/* MODIFIED: Replaced list with a "View Details" button */}
        <Stack direction="horizontal" gap="2" className="mt-4">
            <Button
              variant="outline-secondary"
              className="ms-auto"
              onClick={onViewIncomeClick}
            >
              View Details
            </Button>
          </Stack>
      </Card.Body>
    </Card>
  );
}
