import Link from "next/link";
import Image from "next/image";
import { StarRating } from "./star-rating";
import { Price } from "./price";
import { Product, ProductRegion } from "@prisma/client";

type ProductWithRegion = Product & {
  regions: ProductRegion[];
};

export function ProductCard({
  product,
  currencyCode,
  rateFromUsd,
}: {
  product: ProductWithRegion;
  currencyCode: string;
  rateFromUsd: number;
}) {
  const region = product.regions[0];
  const isAvailable = region?.available ?? false;
  const inStock = (region?.stock ?? 0) > 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col rounded-lg bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-border"
    >
      <div className="relative aspect-square w-full bg-muted overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3
          className="font-medium text-base line-clamp-2"
          title={product.title}
        >
          {product.title}
        </h3>
        
        <div className="mt-auto flex flex-col gap-2">
          <StarRating rating={product.ratingAvg} count={product.ratingCount} />
          
          <div className="flex items-end justify-between">
            <Price
              usdCents={product.basePriceCents}
              currencyCode={currencyCode}
              rateFromUsd={rateFromUsd}
              className="text-xl"
            />
          </div>

          <div className="text-sm">
            {!isAvailable ? (
              <span className="text-destructive font-medium">Currently unavailable</span>
            ) : !inStock ? (
              <span className="text-destructive font-medium">Out of stock</span>
            ) : (
              <span className="text-success font-medium">
                In stock (Ships in {region.shippingDays} days)
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
