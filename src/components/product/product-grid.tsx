import { ProductCard } from "./product-card";
import { Product, ProductRegion } from "@prisma/client";

type ProductWithRegion = Product & {
  regions: ProductRegion[];
};

export function ProductGrid({
  products,
  currencyCode,
  rateFromUsd,
}: {
  products: ProductWithRegion[];
  currencyCode: string;
  rateFromUsd: number;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-lg font-medium">No products found</h3>
        <p className="text-muted-foreground mt-2">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          currencyCode={currencyCode}
          rateFromUsd={rateFromUsd}
        />
      ))}
    </div>
  );
}
