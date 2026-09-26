import Link from "next/link";
import { getHomeData } from "@/lib/catalog";
import { getRegions, getFxRates, getActiveRegion, getActiveCurrency } from "@/lib/prefs";
import { ProductGrid } from "@/components/product/product-grid";
import { rateFor } from "@/lib/money";

export default async function Home() {
  const [regions, rates] = await Promise.all([getRegions(), getFxRates()]);
  const activeRegion = await getActiveRegion(regions);
  const activeCurrency = await getActiveCurrency(activeRegion.currencyCode);
  
  const fxMap = Object.fromEntries(rates.map((r) => [r.currencyCode, r]));
  const rateFromUsd = rateFor(fxMap, activeCurrency);

  const { categories, featured, newest } = await getHomeData(activeRegion.id);

  return (
    <div className="flex flex-col gap-12 pb-12">
      <section className="bg-muted py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Welcome to amaclone</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Discover millions of products with fast delivery to {activeRegion.name}.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="flex items-center justify-center p-6 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow border border-border text-center font-medium"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
          <ProductGrid
            products={featured}
            currencyCode={activeCurrency}
            rateFromUsd={rateFromUsd}
          />
        </section>
      )}

      {newest.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">New Arrivals</h2>
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
