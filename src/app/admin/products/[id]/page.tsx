import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Admin · Edit product" };

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({
      orderBy: { path: "asc" },
      select: { id: true, name: true, path: true },
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Edit product</h2>
      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          title: product.title,
          slug: product.slug,
          description: product.description,
          brand: product.brand,
          categoryId: product.categoryId,
          basePriceCents: product.basePriceCents,
          imageUrl: product.imageUrl,
          featured: product.featured,
          isActive: product.isActive,
        }}
      />
    </div>
  );
}
