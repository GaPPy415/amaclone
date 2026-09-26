import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Admin · New product" };

export default async function AdminNewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { path: "asc" },
    select: { id: true, name: true, path: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">New product</h2>
      <ProductForm categories={categories} />
    </div>
  );
}
