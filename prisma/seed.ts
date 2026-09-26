import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import crypto from "crypto";

const prisma = new PrismaClient();

type CategoryDef = { name: string; children?: CategoryDef[] };

type ProductSeed = {
  slug: string;
  title: string;
  description: string;
  brand: string;
  categoryId: string;
  basePriceCents: number;
  imageUrl: string;
  featured: boolean;
};

type ProductRegionSeed = {
  productId: string;
  regionId: string;
  available: boolean;
  stock: number;
  shippingDays: number;
};

type BundleSeed = { productAId: string; productBId: string; score: number };

type ReviewSeed = {
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
};

const brands = [
  "Acme",
  "Globex",
  "Initech",
  "Soylent",
  "Umbrella",
  "Massive Dynamic",
  "Stark",
  "Wayne",
  "Aperture",
  "Cyberdyne",
  "Tyrell",
  "Wonka",
];

const adjectives = [
  "Pro",
  "Max",
  "Ultra",
  "Lite",
  "Plus",
  "Elite",
  "Essential",
  "Advanced",
  "Smart",
  "Super",
  "Compact",
  "Signature",
];

const descriptionLeads = [
  "Built for everyday use",
  "Engineered for demanding buyers",
  "A dependable pick for the whole household",
  "Designed to deliver consistent results",
  "Made for people who expect more from the basics",
  "A straightforward upgrade over the entry-level option",
];

const descriptionFeatures = [
  "durable materials",
  "a compact footprint",
  "long service life",
  "straightforward setup",
  "low running costs",
  "a refined finish",
  "a well-balanced spec",
  "quiet operation",
];

const descriptionClosers = [
  "Backed by our standard returns policy.",
  "Ships from regional stock with tracked delivery.",
  "Consistently rated by verified buyers.",
  "Ready to use out of the box.",
  "Covered for the first year against defects.",
];

const reviewComments = [
  "Great product, highly recommend.",
  "Not bad, but could be better.",
  "Exactly what I was looking for.",
  "Terrible quality, broke after a week.",
  "Good value for the price.",
  "Fast shipping and works perfectly.",
  "I love this so much.",
  "Decent, does the job.",
  "Better than I expected for the money.",
  "Would buy again without hesitation.",
  "Arrived on time and well packaged.",
  "The finish is nicer than the photos suggest.",
  "Stopped working after two months.",
  "Does what it says, nothing more.",
  "Perfect for my setup.",
  "Slightly smaller than I imagined.",
  "Solid build, feels premium.",
  "Wish it came with more accessories.",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function describeProduct(
  title: string,
  categoryName: string,
  brand: string,
  index: number,
): string {
  const lead = descriptionLeads[index % descriptionLeads.length];
  const feature = descriptionFeatures[(index * 3) % descriptionFeatures.length];
  const closer = descriptionClosers[(index * 5) % descriptionClosers.length];
  return `${title} from ${brand} is part of our ${categoryName.toLowerCase()} range. ${lead}, with ${feature} and a specification that holds up to regular use. ${closer}`;
}

async function main() {
  if ((await prisma.product.count()) > 0) {
    console.log("Database already seeded. Exiting.");
    return;
  }

  console.log("Starting seed...");

  const regionsData = [
    { code: "US", name: "United States", currencyCode: "USD" },
    { code: "EU", name: "European Union", currencyCode: "EUR" },
    { code: "CH", name: "Switzerland", currencyCode: "CHF" },
    { code: "UK", name: "United Kingdom", currencyCode: "GBP" },
  ];

  const regions = await Promise.all(
    regionsData.map((region) => prisma.region.create({ data: region })),
  );

  const fxRatesData = [
    { currencyCode: "USD", rateFromUsd: 1, symbol: "$" },
    { currencyCode: "EUR", rateFromUsd: 0.92, symbol: "€" },
    { currencyCode: "CHF", rateFromUsd: 0.88, symbol: "Fr" },
    { currencyCode: "GBP", rateFromUsd: 0.79, symbol: "£" },
  ];

  await Promise.all(
    fxRatesData.map((rate) => prisma.fxRate.create({ data: rate })),
  );

  const categoriesDef: CategoryDef[] = [
    {
      name: "Electronics",
      children: [
        { name: "Computers", children: [{ name: "Laptops" }, { name: "Desktops" }] },
        { name: "Audio", children: [{ name: "Headphones" }, { name: "Speakers" }] },
      ],
    },
    {
      name: "PC & Video Games",
      children: [
        {
          name: "Consoles",
          children: [{ name: "Handhelds" }, { name: "Home Consoles" }],
        },
        { name: "Games" },
      ],
    },
    { name: "Music" },
    {
      name: "Toys & Games",
      children: [{ name: "Board Games" }, { name: "Action Figures" }],
    },
    {
      name: "Pet Supplies",
      children: [
        {
          name: "Dogs",
          children: [{ name: "Dog Food" }, { name: "Dog Toys" }],
        },
        { name: "Cats" },
      ],
    },
    {
      name: "Books",
      children: [{ name: "Fiction" }, { name: "Non-Fiction" }],
    },
    {
      name: "Home & Kitchen",
      children: [{ name: "Furniture" }, { name: "Appliances" }],
    },
    { name: "Sports & Outdoors" },
    { name: "Beauty & Personal Care" },
    { name: "Grocery" },
    { name: "Clothing Shoes & Jewelry" },
    { name: "Tools & Home Improvement" },
    { name: "Automotive" },
    { name: "Baby" },
  ];

  const leafCategories: { id: string; name: string }[] = [];
  let maxDepth = 0;
  let categoryCount = 0;

  async function createCategory(
    def: CategoryDef,
    parentId: string | null,
    parentPath: string,
    position: number,
    depth: number,
  ): Promise<void> {
    const slug = slugify(def.name);
    const path = parentPath ? `${parentPath}/${slug}` : slug;
    const category = await prisma.category.create({
      data: { name: def.name, slug, parentId, path, position },
    });
    categoryCount++;
    if (depth > maxDepth) maxDepth = depth;

    if (def.children && def.children.length > 0) {
      for (let i = 0; i < def.children.length; i++) {
        await createCategory(def.children[i], category.id, path, i, depth + 1);
      }
    } else {
      leafCategories.push({ id: category.id, name: def.name });
    }
  }

  for (let i = 0; i < categoriesDef.length; i++) {
    await createCategory(categoriesDef[i], null, "", i, 1);
  }

  const productsData: ProductSeed[] = [];
  let productIndex = 0;
  let featuredCount = 0;

  for (const leaf of leafCategories) {
    for (let i = 1; i <= 10; i++) {
      const brand = brands[productIndex % brands.length];
      const adjective = adjectives[(productIndex * 7) % adjectives.length];
      const singular = leaf.name.replace(/s$/, "");
      const title = `${brand} ${singular} ${adjective} ${i}`;
      const slug = `${slugify(title)}-${crypto.randomBytes(2).toString("hex")}`;
      const isFeatured = featuredCount < 12 && productIndex % 9 === 0;
      if (isFeatured) featuredCount++;

      productsData.push({
        slug,
        title,
        description: describeProduct(title, leaf.name, brand, productIndex),
        brand,
        categoryId: leaf.id,
        basePriceCents: 999 + ((productIndex * 977) % 40000),
        imageUrl: `https://picsum.photos/seed/${slug}/600/600`,
        featured: isFeatured,
      });
      productIndex++;
    }
  }

  let featuredFill = 0;
  while (featuredCount < 12 && featuredFill < productsData.length) {
    if (!productsData[featuredFill].featured) {
      productsData[featuredFill].featured = true;
      featuredCount++;
    }
    featuredFill++;
  }

  const createdProducts: { id: string; title: string; categoryId: string; basePriceCents: number; imageUrl: string }[] = [];
  for (const product of productsData) {
    const created = await prisma.product.create({ data: product });
    createdProducts.push({
      id: created.id,
      title: created.title,
      categoryId: created.categoryId,
      basePriceCents: created.basePriceCents,
      imageUrl: created.imageUrl,
    });
  }

  const productRegionsData: ProductRegionSeed[] = [];
  for (let pIdx = 0; pIdx < createdProducts.length; pIdx++) {
    const product = createdProducts[pIdx];
    for (let rIdx = 0; rIdx < regions.length; rIdx++) {
      const region = regions[rIdx];
      const available = (pIdx * 3 + rIdx * 5) % 7 !== 0;
      productRegionsData.push({
        productId: product.id,
        regionId: region.id,
        available,
        stock: available ? 1 + ((pIdx * 13 + rIdx * 7) % 80) : 0,
        shippingDays: 3 + ((pIdx + rIdx * 2) % 8),
      });
    }
  }
  await prisma.productRegion.createMany({ data: productRegionsData });

  const bundlesData: BundleSeed[] = [];
  const bundlePairs = new Set<string>();

  for (const leaf of leafCategories) {
    const leafProducts = createdProducts.filter((p) => p.categoryId === leaf.id);
    for (let i = 0; i < leafProducts.length; i++) {
      const product = leafProducts[i];
      const partnerCount = 1 + (i % 4);
      let added = 0;
      for (let step = 1; step < leafProducts.length && added < partnerCount; step++) {
        const partner = leafProducts[(i + step) % leafProducts.length];
        if (partner.id === product.id) continue;
        const forward = `${product.id}-${partner.id}`;
        const backward = `${partner.id}-${product.id}`;
        if (bundlePairs.has(forward) || bundlePairs.has(backward)) continue;
        bundlePairs.add(forward);
        bundlesData.push({
          productAId: product.id,
          productBId: partner.id,
          score: Math.round((0.3 + ((i + step) % 7) * 0.1) * 100) / 100,
        });
        added++;
      }
    }
  }
  await prisma.bundle.createMany({ data: bundlesData });

  const usersToCreate = [
    { email: "admin@amaclone.dev", name: "Store Admin", role: "admin", password: "admin12345" },
    { email: "shopper@amaclone.dev", name: "Sam Shopper", role: "user", password: "shopper12345" },
  ];
  for (let i = 1; i <= 8; i++) {
    usersToCreate.push({
      email: `demo${i}@amaclone.dev`,
      name: `Demo User ${i}`,
      role: "user",
      password: `demo${i}pass`,
    });
  }

  const createdUsers: { id: string; email: string }[] = [];
  for (const candidate of usersToCreate) {
    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(candidate.password);
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: candidate.email,
        name: candidate.name,
        role: candidate.role,
        emailVerified: true,
      },
    });
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });
    createdUsers.push({ id: user.id, email: user.email });
  }

  const reviewTitles: Record<number, string> = {
    1: "Disappointed",
    2: "Not great",
    3: "It's okay",
    4: "Good buy",
    5: "Excellent",
  };

  for (let index = 0; index < createdProducts.length; index++) {
    const product = createdProducts[index];
    const numReviews = 2 + (index % 9);
    let totalRating = 0;
    const reviewsData: ReviewSeed[] = [];
    const chosen = createdUsers.slice(0, Math.min(numReviews, createdUsers.length));
    for (let r = 0; r < chosen.length; r++) {
      const bucket = (index + r * 3) % 10;
      const rating = bucket < 1 ? 5 : bucket < 3 ? 4 : bucket < 5 ? 5 : bucket < 7 ? 4 : bucket < 8 ? 3 : bucket < 9 ? 2 : 1;
      totalRating += rating;
      reviewsData.push({
        productId: product.id,
        userId: chosen[r].id,
        rating,
        title: reviewTitles[rating],
        comment: reviewComments[(index + r) % reviewComments.length],
      });
    }
    const ratingAvg = Math.round((totalRating / reviewsData.length) * 10) / 10;
    await prisma.review.createMany({ data: reviewsData });
    await prisma.product.update({
      where: { id: product.id },
      data: { ratingAvg, ratingCount: reviewsData.length },
    });
  }

  const shopper = createdUsers.find((user) => user.email === "shopper@amaclone.dev")!;
  const usRegion = regions.find((region) => region.code === "US")!;

  const address = await prisma.address.create({
    data: {
      userId: shopper.id,
      label: "Home",
      line1: "123 Main St",
      city: "Seattle",
      postalCode: "98101",
      regionId: usRegion.id,
      isDefault: true,
    },
  });

  let orderCount = 0;
  for (let i = 0; i < 3; i++) {
    const itemCount = 2 + (i % 3);
    const orderProducts = createdProducts.filter((_, index) => (index + i) % 37 === 0).slice(0, itemCount);
    let subtotalCents = 0;
    const itemsData = orderProducts.map((product, itemIndex) => {
      const quantity = 1 + ((i + itemIndex) % 3);
      subtotalCents += product.basePriceCents * quantity;
      return {
        productId: product.id,
        titleSnapshot: product.title,
        imageSnapshot: product.imageUrl,
        unitPriceCents: product.basePriceCents,
        quantity,
      };
    });
    const shippingCents = 500;
    await prisma.order.create({
      data: {
        userId: shopper.id,
        regionId: usRegion.id,
        addressId: address.id,
        addressSnapshot: {
          label: address.label,
          line1: address.line1,
          city: address.city,
          postalCode: address.postalCode,
        },
        subtotalCents,
        shippingCents,
        totalCents: subtotalCents + shippingCents,
        currencyCode: "USD",
        fxRateUsed: 1,
        items: { create: itemsData },
      },
    });
    orderCount++;
  }

  console.log("Seed completed successfully!");
  console.log("--- Summary ---");
  console.log(`Categories: ${categoryCount} (Max Depth: ${maxDepth})`);
  console.log(`Products: ${createdProducts.length}`);
  console.log(`ProductRegions: ${productRegionsData.length}`);
  console.log(`Bundles: ${bundlesData.length}`);
  console.log(`Users: ${createdUsers.length}`);
  console.log(`Orders: ${orderCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
