import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getOrdersForUser() {
  const user = await getCurrentUser();
  if (!user) return [];
  return prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true, region: true },
  });
}

export async function getOrderForUser(orderId: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, region: true, address: true },
  });
  if (!order || order.userId !== user.id) return null;
  return order;
}
