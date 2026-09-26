"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { readCart } from "@/lib/cart";
import { createOrderForCurrentUser } from "@/lib/checkout";

export type CheckoutState = { ok: boolean; message?: string };

const checkoutSchema = z.object({
  addressId: z.string().optional(),
  label: z.string().max(60).optional(),
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/checkout");

  const cart = await readCart();
  if (!cart || cart.items.length === 0) redirect("/cart");

  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please provide a valid delivery address." };
  }

  const result = await createOrderForCurrentUser(parsed.data);
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/cart");
  revalidatePath("/orders");
  redirect(`/orders/${result.orderId}`);
}
