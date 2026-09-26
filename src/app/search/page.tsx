import { listProducts, listBrands, getPriceBounds, parseSort } from "@/lib/catalog";
import { getRegions, getFxRates, getActiveRegion, getActiveCurrency } from "@/lib/prefs";
import { ProductGrid } from "@/components/product/product-grid";
import { FilterPanel } from "@/components/product/filter-panel";
import { Pagination } from "@/components/product/pagination";
import { PageSizeSelect } from "@/components/product/page-size-select";
import { rateFor } from "@/lib/money";

function toNumber(value: string | string[] | undefined) {
  if (typeof value !== "string" || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parsePageSize(value: string | string[] | undefined) {
  const parsed = toNumber(value);
  return parsed === 12 || parsed === 24 || parsed === 36 ? parsed : 24;
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
  const pageSize = parsePageSize(sp.pageSize);
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
    pageSize,
  });

  const [brands, bounds] = await Promise.all([
    listBrands({ regionId: activeRegion.id, q }),
    getPriceBounds({ regionId: activeRegion.id, q, brand }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <FilterPanel
            brands={brands}
            currencyCode={activeCurrency}
            rateFromUsd={rateFromUsd}
            priceFloorCents={bounds.floorCents}
            priceCeilCents={bounds.ceilCents}
          />
        </aside>

        <div className="flex-1">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {q ? `Results for "${q}"` : "All products"}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {totalCount} {totalCount === 1 ? "result" : "results"}
              </span>
              <PageSizeSelect value={pageSize} />
            </div>
          </div>

          <ProductGrid
            products={rows}
            currencyCode={activeCurrency}
            rateFromUsd={rateFromUsd}
          />

          <Pagination page={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}
