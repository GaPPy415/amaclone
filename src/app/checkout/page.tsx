import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readCart, cartSubtotalCents } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import {
  getRegions,
  getFxRates,
  getActiveRegion,
  getActiveCurrency,
} from "@/lib/prefs";
import { rateFor, formatMoney } from "@/lib/money";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/checkout");

  const cart = await readCart();
  if (!cart || cart.items.length === 0) redirect("/cart");

  const [regions, rates, addresses] = await Promise.all([
    getRegions(),
    getFxRates(),
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: "desc" },
    }),
  ]);
  const activeRegion = await getActiveRegion(regions);
  const activeCurrency = await getActiveCurrency(activeRegion.currencyCode);
  const fxMap = Object.fromEntries(rates.map((r) => [r.currencyCode, r]));
  const rateFromUsd = rateFor(fxMap, activeCurrency);

  const subtotalCents = cartSubtotalCents(cart);
  const shippingCents = subtotalCents >= 5000 ? 0 : 500;
  const totalCents = subtotalCents + shippingCents;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Delivery address</h2>
            <CheckoutForm
              addresses={addresses.map((address) => ({
                id: address.id,
                label: address.label,
                line1: address.line1,
                line2: address.line2,
                city: address.city,
                postalCode: address.postalCode,
              }))}
            />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="flex flex-col gap-4 p-6">
            <h2 className="text-lg font-semibold">
              Order summary ({cart.items.length})
            </h2>
            <ul className="flex flex-col gap-3 text-sm">
              {cart.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span className="line-clamp-2">
                    {item.product.title} × {item.quantity}
                  </span>
                  <span className="tabular-nums">
                    {formatMoney(
                      item.product.basePriceCents * item.quantity,
                      activeCurrency,
                      rateFromUsd,
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
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
              <div className="flex justify-between text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {formatMoney(totalCents, activeCurrency, rateFromUsd)}
                </dd>
              </div>
            </dl>
            <Link
              href="/cart"
              className="text-sm text-muted-foreground hover:underline"
            >
              Edit cart
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
