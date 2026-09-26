import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Admin" };

export default async function AdminDashboardPage() {
  const [products, categories, users, orders, reviews] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.review.count(),
  ]);

  const stats = [
    { label: "Products", value: products },
    { label: "Categories", value: categories },
    { label: "Users", value: users },
    { label: "Orders", value: orders },
    { label: "Reviews", value: reviews },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold tabular-nums">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
