import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const CART_COOKIE = "amaclone_cart";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type CartWithItems = Prisma.CartGetPayload<{
  include: { items: { include: { product: true } } };
}>;

const cartInclude = {
  items: {
    include: { product: true },
    orderBy: { id: "asc" as const },
  },
};

export async function readCart(): Promise<CartWithItems | null> {
  const user = await getCurrentUser();
  if (user) {
    return prisma.cart.findUnique({
      where: { userId: user.id },
      include: cartInclude,
    });
  }
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return null;
  return prisma.cart.findUnique({
    where: { guestToken: token },
    include: cartInclude,
  });
}

export async function getCartCount(): Promise<number> {
  const user = await getCurrentUser();
  if (user) {
    const agg = await prisma.cartItem.aggregate({
      where: { cart: { userId: user.id } },
      _sum: { quantity: true },
    });
    return agg._sum.quantity ?? 0;
  }
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return 0;
  const agg = await prisma.cartItem.aggregate({
    where: { cart: { guestToken: token } },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

export async function getOrCreateCart(): Promise<{ id: string }> {
  const user = await getCurrentUser();
  if (user) {
    const existing = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId: user.id } });
  }

  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  if (token) {
    const existing = await prisma.cart.findUnique({ where: { guestToken: token } });
    if (existing) return existing;
  }

  const freshToken = randomUUID();
  const cart = await prisma.cart.create({ data: { guestToken: freshToken } });
  store.set(CART_COOKIE, freshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
  return cart;
}

export async function mergeGuestCartIntoUser(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  if (!token) return;

  const guestCart = await prisma.cart.findUnique({
    where: { guestToken: token },
    include: { items: true },
  });

  if (guestCart) {
    const userCart = await prisma.cart.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    for (const item of guestCart.items) {
      const existing = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: { cartId: userCart.id, productId: item.productId },
        },
      });
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: item.productId,
            quantity: item.quantity,
          },
        });
      }
    }

    await prisma.cart.delete({ where: { id: guestCart.id } });
  }

  store.delete(CART_COOKIE);
}

export function cartSubtotalCents(cart: CartWithItems | null): number {
  if (!cart) return 0;
  return cart.items.reduce(
    (sum, item) => sum + item.product.basePriceCents * item.quantity,
    0,
  );
}
