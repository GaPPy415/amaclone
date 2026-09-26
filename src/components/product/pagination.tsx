"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jumpTo, setJumpTo] = useState("");

  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const jump = () => {
    const target = Number(jumpTo);
    if (!Number.isFinite(target)) return;
    const clamped = Math.min(Math.max(Math.round(target), 1), totalPages);
    setJumpTo("");
    if (clamped === page) return;
    router.push(hrefFor(clamped));
  };

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  const navButtonClass = "size-8";

  return (
    <div className="mt-10 flex flex-col items-center gap-4">
      <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
        {page > 1 ? (
          <Button asChild variant="outline" size="icon" className={navButtonClass}>
            <Link href={hrefFor(page - 1)} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="icon" className={navButtonClass} disabled aria-label="Previous page">
            <ChevronLeft className="size-4" />
          </Button>
        )}

        {start > 1 && (
          <>
            <Button asChild variant="ghost" size="icon" className={navButtonClass}>
              <Link href={hrefFor(1)}>1</Link>
            </Button>
            {start > 2 && <span className="px-2 text-muted-foreground">...</span>}
          </>
        )}

        {pages.map((candidate) => (
          <Button
            key={candidate}
            asChild={candidate !== page}
            variant={candidate === page ? "default" : "ghost"}
            size="icon"
            className={navButtonClass}
            aria-current={candidate === page ? "page" : undefined}
          >
            {candidate === page ? <span>{candidate}</span> : <Link href={hrefFor(candidate)}>{candidate}</Link>}
          </Button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
            <Button asChild variant="ghost" size="icon" className={navButtonClass}>
              <Link href={hrefFor(totalPages)}>{totalPages}</Link>
            </Button>
          </>
        )}

        {page < totalPages ? (
          <Button asChild variant="outline" size="icon" className={navButtonClass}>
            <Link href={hrefFor(page + 1)} aria-label="Next page">
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="icon" className={navButtonClass} disabled aria-label="Next page">
            <ChevronRight className="size-4" />
          </Button>
        )}
      </nav>

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          jump();
        }}
      >
        <label htmlFor="jump-page" className="text-sm text-muted-foreground">
          Go to page
        </label>
        <Input
          id="jump-page"
          type="number"
          inputMode="numeric"
          min={1}
          max={totalPages}
          value={jumpTo}
          placeholder={String(page)}
          aria-label={`Go to page, 1 to ${totalPages}`}
          className="h-8 w-20 tabular-nums"
          onChange={(event) => setJumpTo(event.target.value)}
        />
        <span className="text-sm text-muted-foreground">of {totalPages}</span>
        <Button type="submit" variant="outline" size="sm" className="h-8">
          Go
        </Button>
      </form>
    </div>
  );
}
