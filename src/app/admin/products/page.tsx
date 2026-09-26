import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/money";
import { deleteProductForm } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Admin · Products" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { category: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Products ({products.length})</h2>
        <Button asChild className="cursor-pointer">
          <Link href="/admin/products/new">New product</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="max-w-xs truncate font-medium">
                  {product.title}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.category.path}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatUsd(product.basePriceCents)}
                </TableCell>
                <TableCell>
                  <Badge variant={product.isActive ? "secondary" : "outline"}>
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm" className="cursor-pointer">
                      <Link href={`/admin/products/${product.id}`}>Edit</Link>
                    </Button>
                    <form action={deleteProductForm}>
                      <input type="hidden" name="id" value={product.id} />
                      <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        className="cursor-pointer"
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
