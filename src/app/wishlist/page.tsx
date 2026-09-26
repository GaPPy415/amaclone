import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistForUser } from "@/lib/wishlist";
import { prisma } from "@/lib/prisma";
import {
  getRegions,
  getFxRates,
  getActiveRegion,
  getActiveCurrency,
} from "@/lib/prefs";
import { rateFor } from "@/lib/money";
import { ProductCard } from "@/components/product/product-card";
import { RemoveFromWishlistButton } from "@/components/wishlist/remove-from-wishlist-button";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Your wishlist</h1>
        <p className="text-muted-foreground">
          Sign in to save products and view your wishlist.
        </p>
        <Button asChild size="lg" className="h-11 cursor-pointer">
          <Link href="/sign-in?next=/wishlist">Sign in</Link>
        </Button>
      </div>
    );
  }

  const items = await getWishlistForUser();
  const [regions, rates] = await Promise.all([getRegions(), getFxRates()]);
  const activeRegion = await getActiveRegion(regions);
  const activeCurrency = await getActiveCurrency(activeRegion.currencyCode);
  const fxMap = Object.fromEntries(rates.map((r) => [r.currencyCode, r]));
  const rateFromUsd = rateFor(fxMap, activeCurrency);

  const regionRows = await prisma.productRegion.findMany({
    where: {
      regionId: activeRegion.id,
      productId: { in: items.map((item) => item.productId) },
    },
  });
  const regionByProduct = new Map(regionRows.map((row) => [row.productId, row]));
  const products = items.map((item) => ({
    ...item.product,
    regions: regionByProduct.has(item.productId)
      ? [regionByProduct.get(item.productId)!]
      : [],
  }));

  if (products.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Your wishlist is empty</h1>
        <p className="text-muted-foreground">
          Tap the heart on any product to save it here.
        </p>
        <Button asChild size="lg" className="h-11 cursor-pointer">
          <Link href="/">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Your wishlist</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="flex flex-col gap-2">
            <ProductCard
              product={product}
              currencyCode={activeCurrency}
              rateFromUsd={rateFromUsd}
            />
            <RemoveFromWishlistButton productId={product.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
