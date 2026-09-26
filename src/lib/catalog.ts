import { prisma } from "@/lib/prisma";
import { Prisma, Category } from "@prisma/client";

type CategoryNode = Category & { children: CategoryNode[] };

export async function getCategoryTree(): Promise<CategoryNode[]> {
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
  });

  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of categories) {
    const node = map.get(cat.id);
    if (!node) continue;
    if (cat.parentId) {
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getCategoryByPath(path: string) {
  const category = await prisma.category.findFirst({
    where: { path },
  });
  if (!category) return null;

  const parts = path.split("/").filter(Boolean);
  const ancestors: Category[] = [];
  let currentPath = "";
  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const ancestor = await prisma.category.findFirst({
      where: { path: currentPath },
    });
    if (ancestor) ancestors.push(ancestor);
  }

  return { category, ancestors };
}

export type ProductSort = "price_asc" | "price_desc" | "rating" | "newest";

export function parseSort(value: string | string[] | undefined): ProductSort {
  if (
    value === "price_asc" ||
    value === "price_desc" ||
    value === "rating" ||
    value === "newest"
  ) {
    return value;
  }
  return "newest";
}

export type ListProductsParams = {
  categoryPath?: string;
  q?: string;
  regionId: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

export async function listProducts(params: ListProductsParams) {
  const {
    categoryPath,
    q,
    regionId,
    minPrice,
    maxPrice,
    minRating,
    sort = "newest",
    page = 1,
    pageSize = 24,
  } = params;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    regions: {
      some: {
        regionId,
        available: true,
      },
    },
  };

  if (categoryPath) {
    where.category = {
      path: {
        startsWith: categoryPath,
      },
    };
  }

  if (q) {
    where.title = {
      contains: q,
      mode: "insensitive",
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.basePriceCents = {};
    if (minPrice !== undefined) where.basePriceCents.gte = minPrice;
    if (maxPrice !== undefined) where.basePriceCents.lte = maxPrice;
  }

  if (minRating !== undefined) {
    where.ratingAvg = {
      gte: minRating,
    };
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { basePriceCents: "asc" };
  if (sort === "price_desc") orderBy = { basePriceCents: "desc" };
  if (sort === "rating") orderBy = { ratingAvg: "desc" };

  const skip = (page - 1) * pageSize;

  const [rows, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        regions: {
          where: { regionId },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { rows, totalCount };
}

export async function getProductBySlug(slug: string, regionId: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      regions: {
        where: { regionId },
      },
    },
  });
}

export async function getProductReviews(productId: string, limit = 5) {
  return prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: { name: true, image: true },
      },
    },
  });
}

export async function getFrequentlyBoughtTogether(productId: string, regionId: string) {
  const bundles = await prisma.bundle.findMany({
    where: {
      OR: [
        { productAId: productId },
        { productBId: productId },
      ],
    },
    orderBy: { score: "desc" },
    take: 4,
    include: {
      productA: {
        include: {
          regions: { where: { regionId } },
        },
      },
      productB: {
        include: {
          regions: { where: { regionId } },
        },
      },
    },
  });

  const products = bundles
    .map((b) => (b.productAId === productId ? b.productB : b.productA))
    .filter((p) => p.isActive && p.regions.some((r) => r.available));

  return products;
}

export async function getHomeData(regionId: string) {
  const [categories, featured, newest] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { position: "asc" },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        featured: true,
        regions: { some: { regionId, available: true } },
      },
      take: 8,
      include: {
        regions: { where: { regionId } },
      },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        regions: { some: { regionId, available: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        regions: { where: { regionId } },
      },
    }),
  ]);

  return { categories, featured, newest };
}
