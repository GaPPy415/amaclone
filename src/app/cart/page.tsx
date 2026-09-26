import Link from "next/link";
import { readCart, cartSubtotalCents } from "@/lib/cart";
import {
  getRegions,
  getFxRates,
  getActiveRegion,
  getActiveCurrency,
} from "@/lib/prefs";
import { rateFor, formatMoney } from "@/lib/money";
import { CartItems, type CartLine } from "@/components/cart/cart-items";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const cart = await readCart();
  const [regions, rates] = await Promise.all([getRegions(), getFxRates()]);
  const activeRegion = await getActiveRegion(regions);
  const activeCurrency = await getActiveCurrency(activeRegion.currencyCode);
  const fxMap = Object.fromEntries(rates.map((r) => [r.currencyCode, r]));
  const rateFromUsd = rateFor(fxMap, activeCurrency);

  const lines: CartLine[] = (cart?.items ?? []).map((item) => ({
    id: item.id,
    slug: item.product.slug,
    title: item.product.title,
    imageUrl: item.product.imageUrl,
    unitPriceCents: item.product.basePriceCents,
    quantity: item.quantity,
  }));

  const subtotalCents = cartSubtotalCents(cart);
  const shippingCents = subtotalCents >= 5000 || subtotalCents === 0 ? 0 : 500;
  const totalCents = subtotalCents + shippingCents;

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="text-muted-foreground">
          Browse the catalog and add something you like.
        </p>
        <Button asChild size="lg" className="h-11 cursor-pointer">
          <Link href="/">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Shopping cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="px-6">
            <CartItems
              lines={lines}
              currencyCode={activeCurrency}
              rateFromUsd={rateFromUsd}
            />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="flex flex-col gap-4 p-6">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">
                  {formatMoney(subtotalCents, activeCurrency, rateFromUsd)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">
                  {shippingCents === 0
                    ? "Free"
                    : formatMoney(shippingCents, activeCurrency, rateFromUsd)}
                </dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-4 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {formatMoney(totalCents, activeCurrency, rateFromUsd)}
                </dd>
              </div>
            </dl>
            <Button asChild size="lg" className="h-11 cursor-pointer">
              <Link href="/checkout">Proceed to checkout</Link>
            </Button>
            <Button asChild variant="ghost" className="cursor-pointer">
              <Link href="/">Continue shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
