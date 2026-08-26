export function hasTimedGoals(goals: Array<{ minute: number | null }>) {
  return goals.some((goal) => goal.minute != null);
}
