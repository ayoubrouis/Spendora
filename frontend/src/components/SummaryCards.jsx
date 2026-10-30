import { formatAmount } from "../utils/format.js";

const cards = [
  { key: "balance", label: "Net balance" },
  { key: "income", label: "Income recorded" },
  { key: "expense", label: "Expenses recorded" },
];

export default function SummaryCards({ totals }) {
  return (
    <section className="summary-grid" aria-label="Transaction totals">
      {cards.map(({ key, label }) => (
        <article className={`summary-item summary-${key}`} key={key}>
          <p className="summary-label">{label}</p>
          <p className="summary-value" aria-live="polite">
            {formatAmount(totals[key])}
          </p>
          <p className="summary-note">Across all recorded transactions</p>
        </article>
      ))}
    </section>
  );
}
