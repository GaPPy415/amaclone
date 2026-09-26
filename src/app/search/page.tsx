import { listProducts, listBrands, parseSort } from "@/lib/catalog";
import { getRegions, getFxRates, getActiveRegion, getActiveCurrency } from "@/lib/prefs";
import { ProductGrid } from "@/components/product/product-grid";
import { FilterPanel } from "@/components/product/filter-panel";
import { rateFor } from "@/lib/money";

function toNumber(value: string | string[] | undefined) {
  if (typeof value !== "string" || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  
  const [regions, rates] = await Promise.all([getRegions(), getFxRates()]);
  const activeRegion = await getActiveRegion(regions);
  const activeCurrency = await getActiveCurrency(activeRegion.currencyCode);
  
  const fxMap = Object.fromEntries(rates.map((r) => [r.currencyCode, r]));
  const rateFromUsd = rateFor(fxMap, activeCurrency);

  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const sort = parseSort(sp.sort);
  const minRating = toNumber(sp.minRating);
  const minPrice = toNumber(sp.minPrice);
  const maxPrice = toNumber(sp.maxPrice);
  const brand = typeof sp.brand === "string" && sp.brand ? sp.brand : undefined;

  const { rows, totalCount } = await listProducts({
    q,
    regionId: activeRegion.id,
    brand,
    sort,
    minRating,
    minPrice,
    maxPrice,
    page,
    pageSize: 24,
  });

  const brands = await listBrands({ regionId: activeRegion.id, q });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <FilterPanel
            brands={brands}
            currencyCode={activeCurrency}
            rateFromUsd={rateFromUsd}
          />
        </aside>

        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {q ? `Results for "${q}"` : "All Products"}
            </h1>
            <span className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? "result" : "results"}
            </span>
          </div>

          <ProductGrid
            products={rows}
            currencyCode={activeCurrency}
            rateFromUsd={rateFromUsd}
          />
        </div>
      </div>
    </div>
  );
}
