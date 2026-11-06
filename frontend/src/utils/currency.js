export const CURRENCIES = [
  { code: "TND", label: "TND — Tunisian Dinar" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "MAD", label: "MAD — Moroccan Dirham" },
  { code: "DZD", label: "DZD — Algerian Dinar" },
  { code: "SAR", label: "SAR — Saudi Riyal" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "CHF", label: "CHF — Swiss Franc" },
  { code: "JPY", label: "JPY — Japanese Yen" },
];

export const DEFAULT_CURRENCY = "TND";
export const BASE_CURRENCY = "TND";
const STORAGE_KEY = "spendora.currency";

// Approximate rates: 1 unit of currency = X TND (base). Simple static table.
const RATES_TO_TND = {
  TND: 1,
  USD: 3.12,
  EUR: 3.58,
  GBP: 4.18,
  MAD: 0.34,
  DZD: 0.023,
  SAR: 0.83,
  AED: 0.85,
  CAD: 2.28,
  CHF: 3.94,
  JPY: 0.0198,
};

export function convertAmount(amount, toCurrency = DEFAULT_CURRENCY, fromCurrency = BASE_CURRENCY) {
  const value = Number(amount) || 0;
  const fromRate = RATES_TO_TND[fromCurrency] ?? 1;
  const toRate = RATES_TO_TND[toCurrency] ?? 1;
  if (toRate === 0) return value;
  // Convert: from -> TND -> to
  const valueInTnd = value * fromRate;
  return valueInTnd / toRate;
}

export function getStoredCurrency() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && CURRENCIES.some((item) => item.code === stored)) {
      return stored;
    }
  } catch {
    // Ignore storage errors and use the default.
  }
  return DEFAULT_CURRENCY;
}

export function setStoredCurrency(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Ignore storage errors.
  }
}
