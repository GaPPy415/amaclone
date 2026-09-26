"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type AdminFormState = { ok: boolean; message?: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}

const productSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  brand: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  basePriceCents: z.coerce.number().int().min(0, "Price must be positive"),
  imageUrl: z.string().min(1, "Image URL is required"),
  featured: z.coerce.boolean(),
  isActive: z.coerce.boolean(),
});

export async function saveProduct(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    brand: formData.get("brand") || undefined,
    categoryId: formData.get("categoryId"),
    basePriceCents: formData.get("basePriceCents"),
    imageUrl: formData.get("imageUrl"),
    featured: formData.get("featured") === "on",
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const payload = {
    title: data.title,
    slug: data.slug,
    description: data.description,
    brand: data.brand ?? null,
    categoryId: data.categoryId,
    basePriceCents: data.basePriceCents,
    imageUrl: data.imageUrl,
    featured: data.featured,
    isActive: data.isActive,
  };

  try {
    if (data.id) {
      await prisma.product.update({ where: { id: data.id }, data: payload });
    } else {
      await prisma.product.create({ data: payload });
    }
  } catch {
    return { ok: false, message: "Could not save the product — the slug must be unique." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProductForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await prisma.product.delete({ where: { id } });
  } catch {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  }
  revalidatePath("/admin/products");
}

export async function saveCategoryForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  if (!name || !slug) return;

  let path = slug;
  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (parent) path = `${parent.path}/${slug}`;
  }

  try {
    await prisma.category.create({ data: { name, slug, parentId, path } });
  } catch {
    return;
  }
  revalidatePath("/admin/categories");
}

export async function deleteCategoryForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const [children, products] = await Promise.all([
    prisma.category.count({ where: { parentId: id } }),
    prisma.product.count({ where: { categoryId: id } }),
  ]);
  if (children > 0 || products > 0) return;

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}

export async function setUserRoleForm(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "user");
  if (!userId || !["user", "admin"].includes(role)) return;
  if (userId === admin.id) return;
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}
