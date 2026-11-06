import { useMemo } from "react";
import { balanceTrend, expenseByCategory, monthlyCashflow } from "../utils/analytics.js";
import { formatAmount, formatDate } from "../utils/format.js";
import { DEFAULT_CURRENCY } from "../utils/currency.js";

const CATEGORY_COLORS = [
  "#32735b",
  "#5b8f7a",
  "#a55043",
  "#c58a5b",
  "#7d8f6a",
  "#8b7aa8",
];

function ChartCard({ title, note, children }) {
  return (
    <article className="insight-card">
      <header className="insight-header">
        <h3>{title}</h3>
        <p>{note}</p>
      </header>
      {children}
    </article>
  );
}

function CashflowChart({ months, currency }) {
  const highest = Math.max(1, ...months.map((month) => Math.max(month.income, month.expense)));

  if (!months.some((month) => month.income > 0 || month.expense > 0)) {
    return <p className="chart-empty">Add a few transactions to see your monthly flow.</p>;
  }

  return (
    <>
      <div className="cashflow-chart">
        {months.map((month, index) => (
          <div className="cashflow-column" key={month.key}>
            <div className="cashflow-bars">
              <div
                className="cashflow-bar cashflow-income"
                style={{
                  height: `${(month.income / highest) * 100}%`,
                  animationDelay: `${index * 60}ms`,
                }}
                title={`Income ${formatAmount(month.income, currency)}`}
              />
              <div
                className="cashflow-bar cashflow-expense"
                style={{
                  height: `${(month.expense / highest) * 100}%`,
                  animationDelay: `${index * 60 + 40}ms`,
                }}
                title={`Expenses ${formatAmount(month.expense, currency)}`}
              />
            </div>
            <span className="cashflow-label">{month.label}</span>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-dot legend-income" aria-hidden="true" />
          Income
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-expense" aria-hidden="true" />
          Expenses
        </span>
      </div>
    </>
  );
}

function CategoryDonut({ categories, currency }) {
  if (categories.total === 0) {
    return <p className="chart-empty">Record an expense to see where the money goes.</p>;
  }

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = categories.items.map((item, index) => {
    const length = item.percent * circumference;
    const segment = {
      ...item,
      length,
      offset,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    };
    offset += length;
    return segment;
  });

  return (
    <>
      <div className="donut-wrap">
        <svg
          className="donut-svg"
          viewBox="0 0 140 140"
          role="img"
          aria-label={`Expenses by category, total ${formatAmount(categories.total, currency)}`}
        >
          <g transform="rotate(-90 70 70)">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="18"
            />
            {segments.map((segment, index) => (
              <circle
                key={`${segment.label}-${index}`}
                className="donut-segment"
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="18"
                strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                strokeDashoffset={-segment.offset}
              />
            ))}
          </g>
        </svg>
        <div className="donut-center">
          <span>Expenses</span>
          <strong>{formatAmount(categories.total, currency)}</strong>
        </div>
      </div>
      <ul className="chart-legend legend-list">
        {segments.map((segment, index) => (
          <li key={`${segment.label}-${index}`}>
            <span className="legend-dot" style={{ background: segment.color }} aria-hidden="true" />
            <span className="legend-name">{segment.label}</span>
            <span className="legend-value">{Math.round(segment.percent * 100)}%</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function TrendChart({ points, currency }) {
  if (points.length === 0) {
    return <p className="chart-empty">Your balance line appears after the first transaction.</p>;
  }

  const width = 540;
  const height = 150;
  const padding = 12;
  const values = points.map((point) => point.value);
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const range = maximum - minimum || 1;
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const coordinates = points.map((point, index) => ({
    x: points.length > 1 ? padding + index * stepX : width / 2,
    y: padding + (1 - (point.value - minimum) / range) * (height - padding * 2),
  }));

  const linePath = coordinates
    .map((coordinate, index) => `${index === 0 ? "M" : "L"}${coordinate.x.toFixed(1)} ${coordinate.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${coordinates[coordinates.length - 1].x.toFixed(1)} ${
    height - padding
  } L${coordinates[0].x.toFixed(1)} ${height - padding} Z`;
  const latest = points[points.length - 1];

  return (
    <>
      <div className="trend-summary">
        <span>Balance now</span>
        <strong className={latest.value >= 0 ? "amount-income" : "amount-expense"}>
          {formatAmount(latest.value, currency)}
        </strong>
      </div>
      <svg className="trend-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Balance over time">
        <path d={areaPath} className="trend-area" />
        <path d={linePath} className="trend-line" pathLength="1000" />
      </svg>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-dot legend-income" aria-hidden="true" />
          Balance
        </span>
        <span className="legend-item">
          {formatDate(points[0].date)} → {formatDate(latest.date)}
        </span>
      </div>
    </>
  );
}

export default function InsightsPanel({ transactions, currency = DEFAULT_CURRENCY }) {
  const months = useMemo(() => monthlyCashflow(transactions, 6), [transactions]);
  const categories = useMemo(() => expenseByCategory(transactions, 5), [transactions]);
  const trend = useMemo(() => balanceTrend(transactions), [transactions]);

  return (
    <section className="insights-grid" id="insights" aria-label="Spending insights">
      <ChartCard title="Monthly cash flow" note="Income vs expenses over the last 6 months">
        <CashflowChart months={months} currency={currency} />
      </ChartCard>
      <ChartCard title="Where money goes" note="Expenses grouped by category">
        <CategoryDonut categories={categories} currency={currency} />
      </ChartCard>
      <ChartCard title="Balance over time" note="Running total as transactions are added">
        <TrendChart points={trend} currency={currency} />
      </ChartCard>
    </section>
  );
}
