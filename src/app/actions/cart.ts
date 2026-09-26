"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart, mergeGuestCartIntoUser } from "@/lib/cart";

const MAX_QUANTITY = 99;

export type CartActionResult = { ok: boolean; message?: string };

export async function addToCart(
  productId: string,
  quantity = 1,
): Promise<CartActionResult> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return { ok: false, message: "This product is no longer available." };
  }

  const cart = await getOrCreateCart();
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, MAX_QUANTITY);
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity: nextQuantity },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function setCartItemQuantity(
  itemId: string,
  quantity: number,
): Promise<CartActionResult> {
  const cart = await getOrCreateCart();
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.cartId !== cart.id) {
    return { ok: false, message: "Item not found in your cart." };
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: Math.min(quantity, MAX_QUANTITY) },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function removeCartItem(itemId: string): Promise<CartActionResult> {
  const cart = await getOrCreateCart();
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.cartId !== cart.id) {
    return { ok: false, message: "Item not found in your cart." };
  }
  await prisma.cartItem.delete({ where: { id: itemId } });
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function mergeGuestCart(): Promise<void> {
  await mergeGuestCartIntoUser();
  revalidatePath("/cart");
  revalidatePath("/");
}
