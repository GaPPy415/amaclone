"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type ReviewState = {
  ok: boolean;
  message?: string;
  requiresAuth?: boolean;
};

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().min(3).max(2000),
});

export async function submitReview(input: {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
}): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, requiresAuth: true, message: "Sign in to review." };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Choose a rating and write a short comment." };
  }
  const { productId, rating, title, comment } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, message: "Product not found." };

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
  });
  if (existing) {
    return { ok: false, message: "You have already reviewed this product." };
  }

  await prisma.review.create({
    data: {
      productId,
      userId: user.id,
      rating,
      title: title?.trim() || null,
      comment,
    },
  });

  const aggregate = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
      ratingCount: aggregate._count.rating,
    },
  });

  revalidatePath(`/product/${product.slug}`);
  return { ok: true };
}
