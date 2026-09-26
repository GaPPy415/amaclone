"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sort = searchParams.get("sort") ?? "newest";
  const minRating = searchParams.get("minRating") ?? "";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6 p-4 bg-card rounded-lg border border-border">
      <div>
        <h3 className="font-bold mb-3">Sort By</h3>
        <select
          className="w-full p-2 rounded-md border border-input bg-background text-foreground"
          value={sort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          aria-label="Sort products"
        >
          <option value="newest">Newest Arrivals</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Avg. Customer Review</option>
        </select>
      </div>

      <div>
        <h3 className="font-bold mb-3">Customer Reviews</h3>
        <div className="flex flex-col gap-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => updateFilter("minRating", rating.toString())}
              className={`text-left text-sm hover:text-primary ${
                minRating === rating.toString() ? "font-bold text-primary" : ""
              }`}
            >
              {rating} Stars & Up
            </button>
          ))}
          {minRating && (
            <button
              onClick={() => updateFilter("minRating", "")}
              className="text-left text-sm text-muted-foreground hover:underline mt-2"
            >
              Clear rating filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
