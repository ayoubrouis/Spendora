import { request } from "./client.js";

export async function getTransactions({ signal } = {}) {
  const [incomeItems, expenseItems] = await Promise.all([
    request("/get-incomes", { signal }),
    request("/get-expenses", { signal }),
  ]);

  if (!Array.isArray(incomeItems) || !Array.isArray(expenseItems)) {
    throw new Error("The server returned an unexpected transaction list.");
  }

  return [
    ...incomeItems.map((item) => ({ ...item, type: "income" })),
    ...expenseItems.map((item) => ({ ...item, type: "expense" })),
  ].sort((first, second) => new Date(second.date) - new Date(first.date));
}

export function createTransaction(type, transaction) {
  const route = type === "income" ? "/add-income" : "/add-expense";

  return request(route, {
    method: "POST",
    body: JSON.stringify(transaction),
  });
}

export function updateTransaction(type, id, transaction) {
  const route = type === "income" ? "/update-income" : "/update-expense";

  return request(`${route}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(transaction),
  });
}

export function removeTransaction(type, id) {
  const route = type === "income" ? "/delete-income" : "/delete-expense";

  return request(`${route}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
