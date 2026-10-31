export function formatAmount(amount) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

export function toDateInputValue(date = new Date()) {
  const parsedDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const localDate = new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}
