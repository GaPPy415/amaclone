"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getActiveRegion } from "@/lib/prefs";

const addressSchema = z.object({
  label: z.string().max(60).optional(),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  regionId: z.string().optional(),
});

export async function addAddressForm(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/account");

  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const fallbackRegion = await getActiveRegion();
  const regionId = parsed.data.regionId || fallbackRegion.id;

  await prisma.address.create({
    data: {
      userId: user.id,
      label: parsed.data.label || null,
      line1: parsed.data.line1,
      line2: parsed.data.line2 || null,
      city: parsed.data.city,
      postalCode: parsed.data.postalCode,
      regionId,
    },
  });

  revalidatePath("/account");
}

export async function removeAddressForm(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/account");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const address = await prisma.address.findFirst({
    where: { id, userId: user.id },
  });
  if (!address) return;

  await prisma.address.delete({ where: { id } });
  revalidatePath("/account");
}

export async function setDefaultAddressForm(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/account");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const address = await prisma.address.findFirst({
    where: { id, userId: user.id },
  });
  if (!address) return;

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);

  revalidatePath("/account");
}
