export function getPeriod(hour: number) {
  if (hour < 5) return "Late night";
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  if (hour < 22) return "Evening";
  return "Late night";
}

export function getTagline(period: string) {
  switch (period) {
    case "Morning":
      return "the backlog can wait a little longer";
    case "Afternoon":
      return "time to push the needle forward";
    case "Evening":
      return "the backlog can wait one more night";
    default:
      return "wrap it up, or don't — it's your shelf";
  }
}

export function formatDateLabel(now: number) {
  const date = new Date(now);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${weekday.toUpperCase()} · ${month.toUpperCase()} ${date.getDate()}`;
}
