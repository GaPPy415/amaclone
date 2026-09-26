"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest arrivals" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Average customer review" },
];

export function FilterPanel({
  brands,
  currencyCode,
  rateFromUsd,
}: {
  brands: string[];
  currencyCode: string;
  rateFromUsd: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sort = searchParams.get("sort") ?? "newest";
  const brand = searchParams.get("brand") ?? "all";
  const minRating = searchParams.get("minRating") ?? "";

  const toDisplayPrice = (usdCents: string | null) =>
    usdCents ? String(Math.round((Number(usdCents) / 100) * rateFromUsd)) : "";

  const [minPrice, setMinPrice] = useState(() =>
    toDisplayPrice(searchParams.get("minPrice")),
  );
  const [maxPrice, setMaxPrice] = useState(() =>
    toDisplayPrice(searchParams.get("maxPrice")),
  );

  const push = (params: URLSearchParams) => {
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    push(params);
  };

  const toUsdCents = (value: string) => {
    const amount = Number(value);
    if (!value || Number.isNaN(amount) || amount < 0) return "";
    return String(Math.round((amount / rateFromUsd) * 100));
  };

  const applyPrice = () => {
    const params = new URLSearchParams(searchParams.toString());
    const min = toUsdCents(minPrice);
    const max = toUsdCents(maxPrice);
    if (min) params.set("minPrice", min);
    else params.delete("minPrice");
    if (max) params.set("maxPrice", max);
    else params.delete("maxPrice");
    push(params);
  };

  const clearAll = () => {
    setMinPrice("");
    setMaxPrice("");
    router.push("?");
  };

  const hasFilters = Boolean(
    brand !== "all" ||
      minRating ||
      searchParams.get("minPrice") ||
      searchParams.get("maxPrice"),
  );

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-2">
        <span id="sort-label" className="text-sm font-medium">
          Sort by
        </span>
        <Select value={sort} onValueChange={(value) => updateFilter("sort", value)}>
          <SelectTrigger aria-labelledby="sort-label" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort results</SelectLabel>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <span id="brand-label" className="text-sm font-medium">
          Brand
        </span>
        <Select
          value={brand}
          onValueChange={(value) =>
            updateFilter("brand", value === "all" ? "" : value)
          }
        >
          <SelectTrigger aria-labelledby="brand-label" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Filter by brand</SelectLabel>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Price ({currencyCode})</span>
        <div className="flex items-center gap-2">
          <Input
            inputMode="numeric"
            placeholder="Min"
            value={minPrice}
            aria-label="Minimum price"
            className="h-9"
            onChange={(event) => setMinPrice(event.target.value)}
          />
          <span className="text-muted-foreground">to</span>
          <Input
            inputMode="numeric"
            placeholder="Max"
            value={maxPrice}
            aria-label="Maximum price"
            className="h-9"
            onChange={(event) => setMaxPrice(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-9 w-full"
          onClick={applyPrice}
        >
          Apply price
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Customer reviews</span>
        <div className="flex flex-col items-start gap-1">
          {[4, 3, 2, 1].map((rating) => {
            const active = minRating === String(rating);
            return (
              <button
                key={rating}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  updateFilter("minRating", active ? "" : String(rating))
                }
                className={`text-sm hover:text-primary ${
                  active ? "font-semibold text-primary" : "text-muted-foreground"
                }`}
              >
                {rating} stars and up
              </button>
            );
          })}
        </div>
      </div>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={clearAll}
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
}
