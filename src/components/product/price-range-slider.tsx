"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";

function parseBound(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function PriceRangeSlider({
  floorCents,
  ceilCents,
  currencyCode,
  rateFromUsd,
}: {
  floorCents: number;
  ceilCents: number;
  currencyCode: string;
  rateFromUsd: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toDisplay = (cents: number) => String(Math.round((cents / 100) * rateFromUsd));
  const toCents = (text: string) => {
    const amount = Number(text);
    if (!Number.isFinite(amount) || amount < 0) return null;
    return Math.round((amount / rateFromUsd) * 100);
  };

  const [range, setRange] = useState<number[]>(() => {
    const min = Math.min(
      Math.max(parseBound(searchParams.get("minPrice"), floorCents), floorCents),
      ceilCents,
    );
    const max = Math.max(
      Math.min(parseBound(searchParams.get("maxPrice"), ceilCents), ceilCents),
      floorCents,
    );
    return [min, max];
  });

  if (ceilCents <= floorCents) {
    return (
      <p className="text-sm text-muted-foreground">
        {formatMoney(floorCents, currencyCode, rateFromUsd)}
      </p>
    );
  }

  const commit = (values: number[]) => {
    const params = new URLSearchParams(searchParams.toString());
    const [min, max] = values;
    if (min > floorCents) params.set("minPrice", String(min));
    else params.delete("minPrice");
    if (max < ceilCents) params.set("maxPrice", String(max));
    else params.delete("maxPrice");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  };

  const applyRange = (values: number[]) => {
    setRange(values);
    commit(values);
  };

  const applyInput = (which: "min" | "max", raw: string) => {
    const cents = toCents(raw);
    if (cents === null) return;
    const [lo, hi] = range;
    if (which === "min") {
      applyRange([Math.min(Math.max(cents, floorCents), hi), hi]);
    } else {
      applyRange([lo, Math.max(Math.min(cents, ceilCents), lo)]);
    }
  };

  const step = Math.max(1, Math.round((ceilCents - floorCents) / 100));

  return (
    <div className="flex flex-col gap-3">
      <Slider
        min={floorCents}
        max={ceilCents}
        step={step}
        value={range}
        onValueChange={setRange}
        onValueCommit={commit}
      />
      <div className="flex items-center gap-2">
        <Input
          key={`min-${range[0]}`}
          type="number"
          inputMode="numeric"
          aria-label={`Minimum price in ${currencyCode}`}
          defaultValue={toDisplay(range[0])}
          className="h-9 tabular-nums"
          onBlur={(event) => applyInput("min", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input
          key={`max-${range[1]}`}
          type="number"
          inputMode="numeric"
          aria-label={`Maximum price in ${currencyCode}`}
          defaultValue={toDisplay(range[1])}
          className="h-9 tabular-nums"
          onBlur={(event) => applyInput("max", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
      </div>
      <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
        <span>{formatMoney(range[0], currencyCode, rateFromUsd)}</span>
        <span>{formatMoney(range[1], currencyCode, rateFromUsd)}</span>
      </div>
    </div>
  );
}
