"use client";

import { useRouter } from "next/navigation";
import { setCurrency } from "@/app/actions/prefs";
import { FxRateRow } from "@/lib/money";

export function CurrencySelector({
  rates,
  currentCode,
}: {
  rates: FxRateRow[];
  currentCode: string;
}) {
  const router = useRouter();

  return (
    <select
      className="bg-transparent text-nav-foreground border-none outline-none cursor-pointer text-sm font-medium"
      value={currentCode}
      onChange={async (e) => {
        await setCurrency(e.target.value);
        router.refresh();
      }}
      aria-label="Select currency"
    >
      {rates.map((r) => (
        <option key={r.currencyCode} value={r.currencyCode} className="text-foreground bg-background">
          {r.currencyCode} ({r.symbol})
        </option>
      ))}
    </select>
  );
}
