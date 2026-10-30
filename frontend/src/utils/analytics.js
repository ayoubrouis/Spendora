function validDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function monthlyCashflow(transactions, monthCount = 6) {
  const now = new Date();
  const buckets = [];

  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - index, 1);
    buckets.push({
      key: `${monthStart.getFullYear()}-${monthStart.getMonth()}`,
      label: new Intl.DateTimeFormat(undefined, { month: "short" }).format(monthStart),
      income: 0,
      expense: 0,
    });
  }

  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const transaction of transactions) {
    const date = validDate(transaction.date);
    if (!date) {
      continue;
    }
    const bucket = byKey.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (!bucket) {
      continue;
    }
    const amount = Number(transaction.amount) || 0;
    if (transaction.type === "income") {
      bucket.income += amount;
    } else {
      bucket.expense += amount;
    }
  }

  return buckets;
}

export function expenseByCategory(transactions, limit = 5) {
  const totals = new Map();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") {
      continue;
    }
    const category = String(transaction.category || "Other").trim() || "Other";
    totals.set(category, (totals.get(category) || 0) + (Number(transaction.amount) || 0));
  }

  const sorted = [...totals.entries()].sort((first, second) => second[1] - first[1]);
  const items = sorted.slice(0, limit);
  const rest = sorted.slice(limit).reduce((sum, [, value]) => sum + value, 0);
  if (rest > 0) {
    items.push(["Other", rest]);
  }

  const total = sorted.reduce((sum, [, value]) => sum + value, 0);

  return {
    total,
    items: items.map(([label, value]) => ({
      label,
      value,
      percent: total > 0 ? value / total : 0,
    })),
  };
}

export function balanceTrend(transactions, maxPoints = 80) {
  const sorted = transactions
    .filter((transaction) => validDate(transaction.date))
    .sort((first, second) => new Date(first.date) - new Date(second.date));

  let running = 0;
  const points = sorted.map((transaction) => {
    const amount = Number(transaction.amount) || 0;
    running += transaction.type === "income" ? amount : -amount;
    return { value: running, date: transaction.date };
  });

  if (points.length <= maxPoints) {
    return points;
  }

  const step = Math.ceil(points.length / maxPoints);
  const sampled = points.filter((_, index) => index % step === 0);
  if (sampled[sampled.length - 1] !== points[points.length - 1]) {
    sampled.push(points[points.length - 1]);
  }
  return sampled;
}
