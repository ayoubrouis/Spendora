import { useState } from "react";
import { exportTransactionsToCsv } from "../utils/export.js";
import { formatAmount, formatDate } from "../utils/format.js";

const PAGE_SIZE = 8;

export default function TransactionList({
  transactions,
  filter,
  onFilterChange,
  page,
  onPageChange,
  deletingId,
  onDelete,
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const query = search.trim().toLowerCase();

  function compareTransactions(first, second) {
    const firstAmount = Number(first.amount) || 0;
    const secondAmount = Number(second.amount) || 0;
    const firstDate = new Date(first.date).getTime() || 0;
    const secondDate = new Date(second.date).getTime() || 0;

    switch (sort) {
      case "oldest":
        return firstDate - secondDate;
      case "highest":
        return secondAmount - firstAmount;
      case "lowest":
        return firstAmount - secondAmount;
      default:
        return secondDate - firstDate;
    }
  }

  const filteredTransactions = transactions
    .filter((item) => {
      if (filter !== "all" && item.type !== filter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [item.title, item.category, item.description].some((value) =>
        String(value || "").toLowerCase().includes(query),
      );
    })
    .sort(compareTransactions);

  const filteredTotal = filteredTransactions.reduce(
    (total, item) =>
      item.type === "income"
        ? total + (Number(item.amount) || 0)
        : total - (Number(item.amount) || 0),
    0,
  );

  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const activePage = Math.min(page, pageCount);
  const visibleTransactions = filteredTransactions.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE,
  );
  const isBrowsing = filter !== "all" || Boolean(query);

  function handleSearchChange(event) {
    setSearch(event.target.value);
    onPageChange(1);
  }

  return (
    <section className="transactions-panel" id="transactions" aria-labelledby="transactions-title">
      <div className="panel-heading list-heading">
        <div>
          <p className="eyebrow">Your activity</p>
          <h2 id="transactions-title">Transactions</h2>
        </div>
      </div>

      <div className="list-tools">
        <label className="search-control">
          <span className="visually-hidden">Search transactions</span>
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search title, category or note"
          />
        </label>
        <label className="filter-control">
          <span className="visually-hidden">Filter transactions</span>
          <select value={filter} onChange={(event) => onFilterChange(event.target.value)}>
            <option value="all">All activity</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
        </label>
        <label className="sort-control">
          <span className="visually-hidden">Sort transactions</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest amount</option>
            <option value="lowest">Lowest amount</option>
          </select>
        </label>
        <button
          className="toolbar-button"
          disabled={filteredTransactions.length === 0}
          onClick={() => exportTransactionsToCsv(filteredTransactions)}
          type="button"
        >
          Export CSV
        </button>
      </div>

      {visibleTransactions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-mark" aria-hidden="true">—</span>
          <h3>{isBrowsing ? "No matches" : "No transactions yet"}</h3>
          <p>
            {isBrowsing
              ? "Try another search or filter, or add a new transaction."
              : "Add an income or expense to start keeping track."}
          </p>
        </div>
      ) : (
        <>
          <div className="transaction-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Transaction</th>
                  <th scope="col">Category</th>
                  <th scope="col">Date</th>
                  <th scope="col" className="amount-column">Amount</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleTransactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>
                      <span className="transaction-name">{transaction.title}</span>
                      <span className={`transaction-type type-${transaction.type}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td>{transaction.category}</td>
                    <td>{formatDate(transaction.date)}</td>
                    <td className={`amount-cell amount-${transaction.type}`}>
                      {transaction.type === "income" ? "+" : "−"}
                      {formatAmount(Number(transaction.amount))}
                    </td>
                    <td className="action-cell">
                      <button
                        aria-label={`Delete ${transaction.title}`}
                        className="delete-button"
                        disabled={deletingId === transaction._id}
                        onClick={() => onDelete(transaction)}
                        type="button"
                      >
                        {deletingId === transaction._id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <p>
              {filteredTransactions.length} {filteredTransactions.length === 1 ? "entry" : "entries"} · total{" "}
              <strong
                className={
                  filteredTotal === 0
                    ? "list-total"
                    : `list-total ${filteredTotal > 0 ? "amount-income" : "amount-expense"}`
                }
              >
                {filteredTotal > 0 ? "+" : filteredTotal < 0 ? "−" : ""}
                {formatAmount(Math.abs(filteredTotal))}
              </strong>
            </p>
            <div className="pagination-actions">
              <button
                disabled={activePage <= 1}
                onClick={() => onPageChange(activePage - 1)}
                type="button"
              >
                Previous
              </button>
              <span>
                Page {activePage} of {pageCount}
              </span>
              <button
                disabled={activePage >= pageCount}
                onClick={() => onPageChange(activePage + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
