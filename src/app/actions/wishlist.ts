"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type WishlistResult = {
  ok: boolean;
  wishlisted?: boolean;
  requiresAuth?: boolean;
};

export async function toggleWishlist(productId: string): Promise<WishlistResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, requiresAuth: true };
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/wishlist");
    return { ok: true, wishlisted: false };
  }

  await prisma.wishlistItem.create({
    data: { userId: user.id, productId },
  });
  revalidatePath("/wishlist");
  return { ok: true, wishlisted: true };
}
