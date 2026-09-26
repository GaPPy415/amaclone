import { formatMoney } from "@/lib/money";

export function Price({
  usdCents,
  currencyCode,
  rateFromUsd,
  className = "",
}: {
  usdCents: number;
  currencyCode: string;
  rateFromUsd: number;
  className?: string;
}) {
  return (
    <span className={`tabular-nums font-mono font-bold text-price ${className}`}>
      {formatMoney(usdCents, currencyCode, rateFromUsd)}
    </span>
  );
}
