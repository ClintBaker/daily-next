const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getLocalCalendarDayStamp(value) {
  const date = new Date(value);

  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getRecurringStatus(item) {
  const today = new Date();
  const daysSinceComplete =
    (getLocalCalendarDayStamp(today) - getLocalCalendarDayStamp(item.lastComplete)) /
    MS_PER_DAY;
  const dueIn = Number(item.cadence) - daysSinceComplete;
  const status = dueIn <= 0 ? "Overdue" : "Up to date";

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
