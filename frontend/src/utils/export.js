function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function exportTransactionsToCsv(transactions) {
  const header = ["Type", "Title", "Category", "Description", "Date", "Amount"];
  const rows = transactions.map((transaction) => [
    transaction.type,
    transaction.title,
    transaction.category,
    transaction.description,
    transaction.date ? new Date(transaction.date).toISOString().slice(0, 10) : "",
    (Number(transaction.amount) || 0).toFixed(2),
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `spendora-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
