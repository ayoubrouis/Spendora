import { useEffect, useMemo, useState } from "react";
import { toDateInputValue } from "../utils/format.js";

const emptyValues = () => ({
  title: "",
  amount: "",
  category: "",
  description: "",
  date: toDateInputValue(),
});

export default function TransactionForm({ onSubmit, submitting, transactions = [], editTransaction = null, onCancelEdit = null }) {
  const [type, setType] = useState("expense");
  const [values, setValues] = useState(emptyValues);
  const [error, setError] = useState("");
  const categories = useMemo(
    () =>
      [...new Set(
        transactions
          .map((transaction) => String(transaction.category || "").trim())
          .filter(Boolean),
      )].sort((first, second) => first.localeCompare(second)),
    [transactions],
  );

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type || "expense");
      setValues({
        title: editTransaction.title || "",
        amount: editTransaction.amount ?? "",
        category: editTransaction.category || "",
        description: editTransaction.description || "",
        date: editTransaction.date ? toDateInputValue(editTransaction.date) : toDateInputValue(),
      });
      setError("");
    } else {
      setType("expense");
      setValues(emptyValues());
      setError("");
    }
  }, [editTransaction]);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const amount = Number(values.amount);
    if (
      !values.title.trim() ||
      !values.category.trim() ||
      !values.description.trim() ||
      !values.date
    ) {
      setError("Complete each field before saving.");
      return;
    }
    if (Number.isNaN(new Date(`${values.date}T00:00:00`).getTime())) {
      setError("Enter a valid date.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (values.description.trim().length > 20) {
      setError("Keep the description to 20 characters or fewer.");
      return;
    }

    try {
      await onSubmit(type, {
        ...values,
        title: values.title.trim(),
        amount,
        category: values.category.trim(),
        description: values.description.trim(),
      });
      if (!editTransaction) {
        setValues(emptyValues());
      }
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <section className="form-panel" id="transaction-form" aria-labelledby="form-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{editTransaction ? "Update entry" : "New entry"}</p>
          <h2 id="form-title">{editTransaction ? "Edit transaction" : "Add a transaction"}</h2>
        </div>
        {editTransaction && onCancelEdit && (
          <button className="secondary-button" type="button" onClick={onCancelEdit} disabled={submitting}>
            Cancel edit
          </button>
        )}
      </div>

      <div className="type-switch" role="group" aria-label="Transaction type">
        {["expense", "income"].map((item) => (
          <button
            className={type === item ? "type-option selected" : "type-option"}
            key={item}
            onClick={() => setType(item)}
            disabled={submitting || Boolean(editTransaction)}
            type="button"
            aria-pressed={type === item}
          >
            {item === "expense" ? "Expense" : "Income"}
          </button>
        ))}
      </div>
      {editTransaction && (
        <p className="edit-type-note">Transaction type can’t be changed while editing.</p>
      )}

      <form className="transaction-form" onSubmit={handleSubmit} noValidate>
        <label>
          Title
          <input
            autoComplete="off"
            maxLength="50"
            name="title"
            onChange={updateField}
            placeholder="e.g. Grocery shop"
            required
            disabled={submitting}
            value={values.title}
          />
        </label>

        <label>
          Amount
          <input
            inputMode="decimal"
            min="0.01"
            name="amount"
            onChange={updateField}
            placeholder="0.00"
            required
            step="0.01"
            type="number"
            disabled={submitting}
            value={values.amount}
          />
        </label>

        <label>
          Category
          <input
            autoComplete="off"
            list="category-suggestions"
            name="category"
            onChange={updateField}
            placeholder="e.g. Food"
            required
            disabled={submitting}
            value={values.category}
          />
          <datalist id="category-suggestions">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>

        <label>
          Date
          <input
            name="date"
            onChange={updateField}
            required
            type="date"
            disabled={submitting}
            value={values.date}
          />
        </label>

        <label>
          Description <span className="field-hint">20 characters max</span>
          <input
            maxLength="20"
            name="description"
            onChange={updateField}
            placeholder="Short note"
            required
            disabled={submitting}
            value={values.description}
          />
        </label>

        {error && (
          <p className="form-error" id="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="primary-button submit-button" disabled={submitting} type="submit">
          {submitting ? (editTransaction ? "Updating…" : "Saving…") : (editTransaction ? "Update transaction" : "Save transaction")}
        </button>
      </form>
    </section>
  );
}
