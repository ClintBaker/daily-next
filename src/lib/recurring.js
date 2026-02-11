export function getRecurringStatus(item) {
  const today = new Date();
  const lastComplete = new Date(item.lastComplete);
  today.setHours(0, 0, 0, 0);
  lastComplete.setHours(0, 0, 0, 0);

  const daysSinceComplete =
    (today.getTime() - lastComplete.getTime()) / (1000 * 60 * 60 * 24);
  const dueIn = Math.round(item.cadence - daysSinceComplete);
  const status = daysSinceComplete >= item.cadence ? "Overdue" : "Up to date";

  return { dueIn, status };
}

export function cadenceLabel(days) {
  const labels = {
    1: "Daily",
    3: "Every 3 days",
    7: "Weekly",
    14: "Every 2 weeks",
    30: "Monthly",
    60: "Every 2 months",
    90: "Every 3 months",
    180: "Every 6 months",
    365: "Yearly",
  };

  return labels[days] || `${days} days`;
}
