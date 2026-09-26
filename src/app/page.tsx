import Link from "next/link";
import { getHomeData } from "@/lib/catalog";
import { getRegions, getFxRates, getActiveRegion, getActiveCurrency } from "@/lib/prefs";
import { ProductGrid } from "@/components/product/product-grid";
import { rateFor } from "@/lib/money";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const [regions, rates] = await Promise.all([getRegions(), getFxRates()]);
  const activeRegion = await getActiveRegion(regions);
  const activeCurrency = await getActiveCurrency(activeRegion.currencyCode);

  const fxMap = Object.fromEntries(rates.map((r) => [r.currencyCode, r]));
  const rateFromUsd = rateFor(fxMap, activeCurrency);

  const { categories, featured, newest } = await getHomeData(activeRegion.id);

  return (
    <div className="flex flex-col gap-14 pb-16">
      <section className="px-4 pt-6 sm:px-6 lg:px-8">
        <div
          className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-border p-8 sm:p-12"
          style={{
            backgroundImage:
              "linear-gradient(135deg, color-mix(in oklab, var(--primary) 45%, transparent), color-mix(in oklab, var(--accent) 32%, transparent) 55%, var(--secondary))",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Everyday marketplace
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold sm:text-5xl">
            Everything you need, delivered to {activeRegion.name}.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-foreground/75">
            Browse products across dozens of categories, with regional availability,
            reviews, and pricing in your local currency.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-11">
              <Link href="/category/electronics">Start shopping</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 bg-card/60">
              <Link href="/search">Browse all products</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="text-2xl font-bold">Shop by category</h2>
          <Link
            href="/search"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex flex-col gap-1 rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="font-heading text-base font-semibold">
                {cat.name}
              </span>
              <span className="text-xs text-muted-foreground">Shop now</span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-bold">Featured products</h2>
          </div>
          <ProductGrid
            products={featured}
            currencyCode={activeCurrency}
            rateFromUsd={rateFromUsd}
          />
        </section>
      )}

      {newest.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-bold">New arrivals</h2>
            <Link
              href="/search?sort=newest"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              See more
            </Link>
          </div>
          <ProductGrid
            products={newest}
            currencyCode={activeCurrency}
            rateFromUsd={rateFromUsd}
          />
        </section>
      )}
    </div>
  );
}
