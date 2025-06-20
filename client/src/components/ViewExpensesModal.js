import { Modal, Button, Stack } from "react-bootstrap";
import { UNCATEGORIZED_BUDGET_ID, useBudgets } from "../contexts/BudgetsContext";
import { currencyFormatter } from "../utils";

export default function ViewExpensesModal({ budgetId, handleClose, onEditExpenseClick, onMoveExpenseClick }) {
  const { getBudgetExpenses, budgets, deleteBudget, deleteExpense } = useBudgets();

  const expenses = getBudgetExpenses(budgetId) || [];
  
  const budget = budgetId === UNCATEGORIZED_BUDGET_ID
      ? { name: "Uncategorized", id: UNCATEGORIZED_BUDGET_ID }
      : (Array.isArray(budgets) ? budgets.find(b => b.id === budgetId) : undefined);

  return (
    <Modal show={budgetId != null} onHide={handleClose} scrollable={true}>
      <Modal.Header closeButton>
        <Modal.Title>
          <Stack direction="horizontal" gap="2">
            <div>Expenses - {budget?.name}</div>
            {budgetId !== UNCATEGORIZED_BUDGET_ID && budget && (
              <Button
                onClick={async () => {
                  if (budget && budget.id) {
                    await deleteBudget({ id: budget.id }); 
                  }
                  handleClose();
                }}
                variant="outline-danger"
              >
                Delete Budget
              </Button>
            )}
          </Stack>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack direction="vertical" gap="3">
          {expenses.map(expense => (
            <Stack direction="horizontal" gap="2" key={expense.id}>
              <div className="me-auto fs-4">{expense.description}</div>
              <div className="fs-5">
                {currencyFormatter.format(expense.amount)}
              </div>
              {budgetId === UNCATEGORIZED_BUDGET_ID && (
                <Button onClick={() => onMoveExpenseClick(expense.id)} size="sm" variant="outline-success">
                  Move
                </Button>
              )}
              <Button onClick={() => onEditExpenseClick(expense.id)} size="sm" variant="outline-primary">
                Edit
              </Button>
              <Button
                onClick={async () => await deleteExpense({ id: expense.id })}
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