export type CurrencyCode = "USD" | "EUR" | "CHF" | "GBP";

export type FxRateRow = {
  currencyCode: string;
  rateFromUsd: number;
  symbol: string;
};

export function toDisplayAmount(usdCents: number, rateFromUsd: number): number {
  return (usdCents * rateFromUsd) / 100;
}

export function formatMoney(
  usdCents: number,
  currencyCode: string,
  rateFromUsd = 1,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "narrowSymbol",
  }).format(toDisplayAmount(usdCents, rateFromUsd));
}

export function formatUsd(usdCents: number): string {
  return formatMoney(usdCents, "USD", 1);
}

export function buildFxMap(rows: FxRateRow[]): Record<string, FxRateRow> {
  return Object.fromEntries(rows.map((row) => [row.currencyCode, row]));
}

export function rateFor(
  fx: Record<string, FxRateRow>,
  currencyCode: string,
): number {
  return fx[currencyCode]?.rateFromUsd ?? 1;
}
