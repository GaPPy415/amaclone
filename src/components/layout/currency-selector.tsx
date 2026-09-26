"use client";

import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import { setCurrency } from "@/app/actions/prefs";
import { FxRateRow } from "@/lib/money";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CurrencySelector({
  rates,
  currentCode,
}: {
  rates: FxRateRow[];
  currentCode: string;
}) {
  const router = useRouter();

  return (
    <Select
      value={currentCode}
      onValueChange={async (value) => {
        await setCurrency(value);
        router.refresh();
      }}
    >
      <SelectTrigger
        aria-label="Display currency"
        className="h-9 w-auto gap-2 border-none bg-transparent px-2 text-nav-foreground shadow-none hover:bg-white/10 focus-visible:ring-0 dark:bg-transparent dark:hover:bg-white/10"
      >
        <Coins className="size-4 shrink-0" />
        <span className="text-xs font-medium uppercase tracking-wide text-nav-foreground/60">
          Currency
        </span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          <SelectLabel>Display prices in</SelectLabel>
          {rates.map((rate) => (
            <SelectItem key={rate.currencyCode} value={rate.currencyCode}>
              {rate.currencyCode} ({rate.symbol})
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
