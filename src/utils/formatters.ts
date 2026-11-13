const CURRENCY = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const COMPACT_CURRENCY = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number | null): string {
  return value === null ? "—" : CURRENCY.format(value);
}

export { CURRENCY, COMPACT_CURRENCY };
