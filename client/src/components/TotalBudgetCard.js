import { useBudgets } from "../contexts/BudgetsContext"
import BudgetCard from "./BudgetCard"

export default function TotalBudgetCard() {
  const { expenses, monthlyCap } = useBudgets()
  const amount = expenses.reduce((total, expense) => total + expense.amount, 0)

  // MODIFIED: 'max' is now determined ONLY by the monthlyCap.
  // If no valid monthly cap is set, max will be null.
  const max = monthlyCap.length > 0 && monthlyCap[0].cap > 0 ? monthlyCap[0].cap : null

  // Don't show the card at all if there's no spending.
  if (amount === 0) return null

  // The underlying BudgetCard component will automatically hide the progress bar
  // and "Remaining" text when the 'max' prop is null.
  return <BudgetCard amount={amount} name="Total" gray max={max} hideButtons />
}
