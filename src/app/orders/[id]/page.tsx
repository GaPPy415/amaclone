import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderForUser } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Order details" };

type AddressSnapshot = {
  label?: string | null;
  line1?: string;
  line2?: string | null;
  city?: string;
  postalCode?: string;
  regionName?: string;
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderForUser(id);

  if (!order) {
    notFound();
  }

  const address = order.addressSnapshot as AddressSnapshot;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="mb-4 cursor-pointer">
        <Link href="/orders">Back to orders</Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order details</h1>
          <p className="font-mono text-sm text-muted-foreground">{order.id}</p>
          <p className="text-sm text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {order.status}
        </Badge>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="mb-4 font-semibold">Items</h2>
          <ul className="flex flex-col divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-4 first:pt-0">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                  <Image
                    src={item.imageSnapshot}
                    alt={item.titleSnapshot}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">{item.titleSnapshot}</span>
                  <span className="text-sm text-muted-foreground">
                    Qty {item.quantity} ·{" "}
                    {formatMoney(
                      item.unitPriceCents,
                      order.currencyCode,
                      order.fxRateUsed,
                    )}{" "}
                    each
                  </span>
                </div>
                <span className="font-semibold tabular-nums text-price">
                  {formatMoney(
                    item.unitPriceCents * item.quantity,
                    order.currencyCode,
                    order.fxRateUsed,
                  )}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-1 p-6 text-sm">
            <h2 className="mb-2 font-semibold">Delivery address</h2>
            {address.label && <span>{address.label}</span>}
            <span>{address.line1}</span>
            {address.line2 && <span>{address.line2}</span>}
            <span>
              {address.city} {address.postalCode}
            </span>
            {address.regionName && (
              <span className="text-muted-foreground">{address.regionName}</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold">Payment summary</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">
                  {formatMoney(
                    order.subtotalCents,
                    order.currencyCode,
                    order.fxRateUsed,
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">
                  {order.shippingCents === 0
                    ? "Free"
                    : formatMoney(
                        order.shippingCents,
                        order.currencyCode,
                        order.fxRateUsed,
                      )}
                </dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-4 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums text-price">
                  {formatMoney(
                    order.totalCents,
                    order.currencyCode,
                    order.fxRateUsed,
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
