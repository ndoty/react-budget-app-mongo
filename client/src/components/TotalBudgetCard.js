import { useBudgets } from "../contexts/BudgetsContext"
import BudgetCard from "./BudgetCard"

export default function TotalBudgetCard() {
  const { expenses, budgets, monthlyCap } = useBudgets()
  const amount = expenses.reduce((total, expense) => total + expense.amount, 0)

  const max = monthlyCap.length > 0 && monthlyCap[0].cap !== 0 ? monthlyCap[0].cap : budgets.reduce((total, budget) => total + budget.max, 0)
  if (max === 0) return null

  return <BudgetCard amount={amount} name="Total" gray max={max} hideButtons />
}
