import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { readCart, cartSubtotalCents } from "@/lib/cart";
import { getActiveRegion } from "@/lib/prefs";

export type CheckoutInput = {
  addressId?: string;
  label?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
};

export type CheckoutResult =
  | { ok: true; orderId: string }
  | { ok: false; message: string };

const FREE_SHIPPING_THRESHOLD_CENTS = 5000;
const SHIPPING_CENTS = 500;

export async function createOrderForCurrentUser(
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const cart = await readCart();
  if (!cart || cart.items.length === 0) {
    return { ok: false, message: "Your cart is empty." };
  }

  const region = await getActiveRegion();
  const fx = await prisma.fxRate.findUnique({
    where: { currencyCode: region.currencyCode },
  });
  const fxRateUsed = fx?.rateFromUsd ?? 1;

  let addressId: string | undefined;
  if (input.addressId) {
    const owned = await prisma.address.findFirst({
      where: { id: input.addressId, userId: user.id },
    });
    if (owned) addressId = owned.id;
  }

  let snapshot: {
    label: string | null;
    line1: string;
    line2: string | null;
    city: string;
    postalCode: string;
    regionName: string;
  };

  if (addressId) {
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address) return { ok: false, message: "The selected address could not be found." };
    snapshot = {
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      postalCode: address.postalCode,
      regionName: region.name,
    };
  } else {
    if (!input.line1 || !input.city || !input.postalCode) {
      return {
        ok: false,
        message: "Enter a street, city and postal code, or choose a saved address.",
      };
    }
    const created = await prisma.address.create({
      data: {
        userId: user.id,
        label: input.label || null,
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        postalCode: input.postalCode,
        regionId: region.id,
      },
    });
    addressId = created.id;
    snapshot = {
      label: created.label,
      line1: created.line1,
      line2: created.line2,
      city: created.city,
      postalCode: created.postalCode,
      regionName: region.name,
    };
  }

  const subtotalCents = cartSubtotalCents(cart);
  const shippingCents =
    subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS;
  const totalCents = subtotalCents + shippingCents;

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      regionId: region.id,
      addressId,
      addressSnapshot: snapshot,
      subtotalCents,
      shippingCents,
      totalCents,
      currencyCode: region.currencyCode,
      fxRateUsed,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          titleSnapshot: item.product.title,
          imageSnapshot: item.product.imageUrl,
          unitPriceCents: item.product.basePriceCents,
          quantity: item.quantity,
        })),
      },
    },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return { ok: true, orderId: order.id };
}
