import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCategoryByPath, listProducts, listBrands, parseSort } from "@/lib/catalog";
import { getRegions, getFxRates, getActiveRegion, getActiveCurrency } from "@/lib/prefs";
import { ProductGrid } from "@/components/product/product-grid";
import { FilterPanel } from "@/components/product/filter-panel";
import { rateFor } from "@/lib/money";
import { prisma } from "@/lib/prisma";

function toNumber(value: string | string[] | undefined) {
  if (typeof value !== "string" || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const path = slug.join("/");
  
  const categoryData = await getCategoryByPath(path);
  if (!categoryData) {
    notFound();
  }
  
  const { category, ancestors } = categoryData;
  
  const children = await prisma.category.findMany({
    where: { parentId: category.id },
    orderBy: { position: "asc" },
  });

  const [regions, rates] = await Promise.all([getRegions(), getFxRates()]);
  const activeRegion = await getActiveRegion(regions);
  const activeCurrency = await getActiveCurrency(activeRegion.currencyCode);
  
  const fxMap = Object.fromEntries(rates.map((r) => [r.currencyCode, r]));
  const rateFromUsd = rateFor(fxMap, activeCurrency);

  const sp = await searchParams;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const sort = parseSort(sp.sort);
  const minRating = toNumber(sp.minRating);
  const minPrice = toNumber(sp.minPrice);
  const maxPrice = toNumber(sp.maxPrice);
  const brand = typeof sp.brand === "string" && sp.brand ? sp.brand : undefined;

  const { rows, totalCount } = await listProducts({
    categoryPath: path,
    regionId: activeRegion.id,
    brand,
    sort,
    minRating,
    minPrice,
    maxPrice,
    page,
    pageSize: 24,
  });

  const brands = await listBrands({
    regionId: activeRegion.id,
    categoryPath: path,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        {ancestors.map((anc) => (
          <div key={anc.id} className="flex items-center gap-2">
            <ChevronRight className="size-4" />
            <Link href={`/category/${anc.path}`} className="hover:text-foreground">
              {anc.name}
            </Link>
          </div>
        ))}
      </nav>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <div className="mb-8">
            <h2 className="font-bold mb-4">{category.name}</h2>
            {children.length > 0 && (
              <ul className="space-y-2 text-sm">
                {children.map((child) => (
                  <li key={child.id}>
                    <Link href={`/category/${child.path}`} className="hover:text-primary">
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <FilterPanel
            brands={brands}
            currencyCode={activeCurrency}
            rateFromUsd={rateFromUsd}
          />
        </aside>

        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">{category.name}</h1>
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
