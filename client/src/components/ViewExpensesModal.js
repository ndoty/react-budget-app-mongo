// client/src/components/ViewExpensesModal.js
import { Modal, Button, Stack } from "react-bootstrap"; // Modal is imported
import { UNCATEGORIZED_BUDGET_ID, useBudgets } from "../contexts/BudgetsContext";
import { currencyFormatter } from "../utils"; // Assuming utils.js exports this

export default function ViewExpensesModal({ budgetId, handleClose }) {
  const { getBudgetExpenses, budgets, deleteBudget, deleteExpense } = useBudgets();

  // Ensure expenses are always an array, even if getBudgetExpenses might return null/undefined initially
  const expenses = getBudgetExpenses(budgetId) || []; 
  
  const budget = budgetId === UNCATEGORIZED_BUDGET_ID
      ? { name: "Uncategorized", id: UNCATEGORIZED_BUDGET_ID }
      : (Array.isArray(budgets) ? budgets.find(b => b.id === budgetId) : undefined);

  return (
    <Modal show={budgetId != null} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          <Stack direction="horizontal" gap="2">
            <div>Expenses - {budget?.name}</div>
            {budgetId !== UNCATEGORIZED_BUDGET_ID && budget && (
              <Button
                onClick={async () => {
                  if (budget && budget.id) { // budget.id is the client-side UUID
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
              <Button
                onClick={async () => await deleteExpense({ id: expense.id })} // expense.id is client-side UUID
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
