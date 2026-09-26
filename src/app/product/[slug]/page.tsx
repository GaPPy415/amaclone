import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProductBySlug, getProductReviews, getFrequentlyBoughtTogether, getCategoryByPath } from "@/lib/catalog";
import { getRegions, getFxRates, getActiveRegion, getActiveCurrency } from "@/lib/prefs";
import { StarRating } from "@/components/product/star-rating";
import { Price } from "@/components/product/price";
import { ProductCard } from "@/components/product/product-card";
import { rateFor } from "@/lib/money";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { isWishlisted } from "@/lib/wishlist";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReviewForm } from "@/components/product/review-form";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const [regions, rates] = await Promise.all([getRegions(), getFxRates()]);
  const activeRegion = await getActiveRegion(regions);
  const activeCurrency = await getActiveCurrency(activeRegion.currencyCode);
  
  const fxMap = Object.fromEntries(rates.map((r) => [r.currencyCode, r]));
  const rateFromUsd = rateFor(fxMap, activeCurrency);

  const product = await getProductBySlug(slug, activeRegion.id);
  if (!product) {
    notFound();
  }

  const categoryData = await getCategoryByPath(product.category.path);
  const ancestors = categoryData?.ancestors ?? [];

  const [reviews, boughtTogether, wishlisted] = await Promise.all([
    getProductReviews(product.id, 5),
    getFrequentlyBoughtTogether(product.id, activeRegion.id),
    isWishlisted(product.id),
  ]);

  const region = product.regions[0];
  const isAvailable = region?.available ?? false;
  const inStock = (region?.stock ?? 0) > 0;

  const user = await getCurrentUser();
  const myReview = user
    ? await prisma.review.findUnique({
        where: { productId_userId: { productId: product.id, userId: user.id } },
      })
    : null;

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
        <div className="flex items-center gap-2">
          <ChevronRight className="size-4" />
          <Link href={`/category/${product.category.path}`} className="hover:text-foreground">
            {product.category.name}
          </Link>
        </div>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <div className="relative aspect-square w-full bg-muted rounded-lg overflow-hidden border border-border lg:col-span-1">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority
          />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-1">
          <h1 className="text-3xl font-bold">{product.title}</h1>
          {product.brand && (
            <p className="text-muted-foreground">
              Brand:{" "}
              <Link
                href={`/search?q=${encodeURIComponent(product.brand)}`}
                className="text-primary hover:underline"
              >
                {product.brand}
              </Link>
            </p>
          )}
          
          <div className="flex items-center gap-4">
            <StarRating rating={product.ratingAvg} count={product.ratingCount} />
          </div>

          <div className="h-px w-full bg-border my-2" />

          <Price
            usdCents={product.basePriceCents}
            currencyCode={activeCurrency}
            rateFromUsd={rateFromUsd}
            className="text-3xl"
          />

          <p className="text-muted-foreground leading-relaxed mt-4">{product.description}</p>
        </div>

        <div className="lg:col-span-1">
          <div className="p-6 rounded-lg border border-border bg-card shadow-sm flex flex-col gap-4">
            <Price
              usdCents={product.basePriceCents}
              currencyCode={activeCurrency}
              rateFromUsd={rateFromUsd}
              className="text-2xl"
            />
            
            <div className="text-sm">
              {!isAvailable ? (
                <span className="text-destructive font-medium">Currently unavailable in {activeRegion.name}</span>
              ) : !inStock ? (
                <span className="text-destructive font-medium">Out of stock</span>
              ) : (
                <span className="text-success font-medium">
                  In stock. Ships in {region.shippingDays} days.
                </span>
              )}
            </div>

            <AddToCartButton
              productId={product.id}
              disabled={!isAvailable || !inStock}
            />
            <WishlistButton
              productId={product.id}
              initiallyWishlisted={wishlisted}
              nextPath={`/product/${product.slug}`}
            />
          </div>
        </div>
      </div>

      {boughtTogether.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Frequently bought together</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {boughtTogether.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                currencyCode={activeCurrency}
                rateFromUsd={rateFromUsd}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <StarRating rating={product.ratingAvg} />
              <span className="font-bold">{product.ratingAvg.toFixed(1)} out of 5</span>
            </div>
            <p className="text-sm text-muted-foreground">{product.ratingCount} global ratings</p>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            {!user ? (
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">
                  <Link
                    href={`/sign-in?next=/product/${product.slug}`}
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </Link>{" "}
                  to write a review.
                </p>
              </div>
            ) : myReview ? (
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground">
                  You have already reviewed this product.
                </p>
              </div>
            ) : (
              <ReviewForm
                productId={product.id}
                nextPath={`/product/${product.slug}`}
              />
            )}

            {reviews.length === 0 ? (
              <p className="text-muted-foreground">No reviews yet.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="flex flex-col gap-2 pb-6 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {review.user.image ? (
                        <Image src={review.user.image} alt={review.user.name} width={32} height={32} />
                      ) : (
                        <span className="text-xs font-medium">{review.user.name[0]}</span>
                      )}
                    </div>
                    <span className="font-medium text-sm">{review.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    {review.title && <span className="font-bold text-sm">{review.title}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm mt-2">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
