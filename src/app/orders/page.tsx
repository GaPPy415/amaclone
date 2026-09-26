import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Your orders</h1>
        <p className="text-muted-foreground">
          Sign in to see your order history.
        </p>
        <Button asChild size="lg" className="h-11 cursor-pointer">
          <Link href="/sign-in?next=/orders">Sign in</Link>
        </Button>
      </div>
    );
  }

  const orders = await getOrdersForUser();

  if (orders.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">No orders yet</h1>
        <p className="text-muted-foreground">
          When you place an order it will appear here.
        </p>
        <Button asChild size="lg" className="h-11 cursor-pointer">
          <Link href="/">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">Your orders</h1>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Order</span>
                <span className="font-mono text-sm">
                  {order.id.slice(0, 12)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-semibold tabular-nums text-price">
                  {formatMoney(
                    order.totalCents,
                    order.currencyCode,
                    order.fxRateUsed,
                  )}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Items</span>
                <span className="tabular-nums">
                  {order.items.reduce((count, item) => count + item.quantity, 0)}
                </span>
              </div>
              <Badge variant="secondary" className="w-fit capitalize">
                {order.status}
              </Badge>
              <Button asChild variant="outline" className="cursor-pointer">
                <Link href={`/orders/${order.id}`}>View details</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
