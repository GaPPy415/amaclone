import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getWishlistCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  return prisma.wishlistItem.count({ where: { userId: user.id } });
}

export async function getWishlistForUser() {
  const user = await getCurrentUser();
  if (!user) return [];
  return prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });
}

export async function isWishlisted(productId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const item = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  return Boolean(item);
}
