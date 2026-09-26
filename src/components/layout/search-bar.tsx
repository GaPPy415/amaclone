"use client";

import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  return (
    <form action="/search" method="GET" className="flex flex-1 max-w-2xl items-center">
      <label htmlFor="search-input" className="sr-only">
        Search products
      </label>
      <div className="relative flex w-full items-center">
        <input
          id="search-input"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search amaclone..."
          className="w-full h-10 rounded-l-md border-none px-4 text-foreground bg-background focus:ring-2 focus:ring-primary outline-none"
        />
        <Button
          type="submit"
          size="icon"
          className="h-10 w-12 rounded-l-none rounded-r-md bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label="Submit search"
        >
          <Search className="size-5" />
        </Button>
      </div>
    </form>
  );
}
