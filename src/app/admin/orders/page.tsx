import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Admin · Orders" };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: true, items: true, region: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Orders ({orders.length})</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">
                  {order.id.slice(0, 12)}
                </TableCell>
                <TableCell>{order.user.email}</TableCell>
                <TableCell className="text-muted-foreground">{order.region.code}</TableCell>
                <TableCell className="tabular-nums">
                  {order.items.reduce((count, item) => count + item.quantity, 0)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatMoney(order.totalCents, order.currencyCode, order.fxRateUsed)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {order.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
