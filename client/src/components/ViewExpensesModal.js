// ... imports ...
import { UNCATEGORIZED_BUDGET_ID, useBudgets } from "../contexts/BudgetsContext"; // deleteBudget, deleteExpense are now async
// ...
export default function ViewExpensesModal({ budgetId, handleClose }) {
  const { getBudgetExpenses, budgets, deleteBudget, deleteExpense } = useBudgets(); // use the renamed context functions

  const expenses = getBudgetExpenses(budgetId);
  const budget =
    UNCATEGORIZED_BUDGET_ID === budgetId
      ? { name: "Uncategorized", id: UNCATEGORIZED_BUDGET_ID }
      : budgets.find(b => b.id === budgetId);

  return (
    <Modal show={budgetId != null} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          <Stack direction="horizontal" gap="2">
            <div>Expenses - {budget?.name}</div>
            {budgetId !== UNCATEGORIZED_BUDGET_ID && budget && ( // Added budget check
              <Button
                onClick={async () => { // make async
                  // The budget object here might not have the original client UUID `id` if it's just from budgets.find.
                  // It's better to pass the full budget object or just its client UUID to deleteBudget.
                  // Assuming `budget` here has the correct `id` (client UUID)
                  if (budget && budget.id) {
                    await deleteBudget({ id: budget.id }); // Pass client ID
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
              {/* ... other expense details ... */}
              <Button
                onClick={async () => await deleteExpense({ id: expense.id })} // Pass client ID
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
