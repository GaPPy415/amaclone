import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  if ((await prisma.product.count()) > 0) {
    console.log("Database already seeded. Exiting.");
    return;
  }

  console.log("Starting seed...");

  // 1. Regions & FxRates
  const regionsData = [
    { code: "US", name: "United States", currencyCode: "USD" },
    { code: "EU", name: "European Union", currencyCode: "EUR" },
    { code: "CH", name: "Switzerland", currencyCode: "CHF" },
    { code: "UK", name: "United Kingdom", currencyCode: "GBP" },
  ];

  const regions = await Promise.all(
    regionsData.map((r) =>
      prisma.region.create({
        data: r,
      })
    )
  );

  const fxRatesData = [
    { currencyCode: "USD", rateFromUsd: 1, symbol: "$" },
    { currencyCode: "EUR", rateFromUsd: 0.92, symbol: "€" },
    { currencyCode: "CHF", rateFromUsd: 0.88, symbol: "Fr" },
    { currencyCode: "GBP", rateFromUsd: 0.79, symbol: "£" },
  ];

  await Promise.all(
    fxRatesData.map((fx) =>
      prisma.fxRate.create({
        data: fx,
      })
    )
  );

  // 2. Categories
  const categoriesDef = [
    {
      name: "Electronics",
      children: [
        {
          name: "Computers",
          children: [{ name: "Laptops" }, { name: "Desktops" }],
        },
        {
          name: "Audio",
          children: [{ name: "Headphones" }, { name: "Speakers" }],
        },
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

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const leafCategories: { id: string; name: string }[] = [];
  let maxDepth = 0;
  let categoryCount = 0;

  async function createCategory(
    def: any,
    parentId: string | null,
    parentPath: string,
    position: number,
    depth: number
  ) {
    const slug = slugify(def.name);
    const path = parentPath ? `${parentPath}/${slug}` : slug;
    const cat = await prisma.category.create({
      data: {
        name: def.name,
        slug,
        parentId,
        path,
        position,
      },
    });
    categoryCount++;
    if (depth > maxDepth) maxDepth = depth;

    if (def.children && def.children.length > 0) {
      for (let i = 0; i < def.children.length; i++) {
        await createCategory(def.children[i], cat.id, path, i, depth + 1);
      }
    } else {
      leafCategories.push({ id: cat.id, name: def.name });
    }
  }

  for (let i = 0; i < categoriesDef.length; i++) {
    await createCategory(categoriesDef[i], null, "", i, 1);
  }

  // 3. Products
  const brands = ["Acme", "Globex", "Initech", "Soylent", "Umbrella", "Massive Dynamic", "Stark", "Wayne"];
  const adjectives = ["Pro", "Max", "Ultra", "Lite", "Plus", "Elite", "Essential", "Advanced", "Smart", "Super"];
  
  const productsData: any[] = [];
  let featuredCount = 0;

  for (const leaf of leafCategories) {
    for (let i = 1; i <= 10; i++) {
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const title = `${brand} ${leaf.name.replace(/s$/, "")} ${adj} ${i}`;
      const slug = slugify(title) + "-" + crypto.randomBytes(2).toString("hex");
      const isFeatured = featuredCount < 12 && Math.random() > 0.8;
      if (isFeatured) featuredCount++;

      productsData.push({
        slug,
        title,
        description: `Experience the best with the ${title}. Designed for ultimate performance and reliability. Perfect for your everyday needs.`,
        brand,
        categoryId: leaf.id,
        basePriceCents: Math.floor(Math.random() * 20000) + 999, // $9.99 to $209.99
        imageUrl: `https://picsum.photos/seed/${slug}/600/600`,
        featured: isFeatured,
      });
    }
  }

  // Ensure exactly 12 featured if we missed it
  while (featuredCount < 12) {
    const p = productsData[Math.floor(Math.random() * productsData.length)];
    if (!p.featured) {
      p.featured = true;
      featuredCount++;
    }
  }

  const createdProducts = await Promise.all(
    productsData.map((p) => prisma.product.create({ data: p }))
  );

  // 4. ProductRegions
  const productRegionsData: any[] = [];
  for (const product of createdProducts) {
    for (const region of regions) {
      const available = Math.random() > 0.15;
      productRegionsData.push({
        productId: product.id,
        regionId: region.id,
        available,
        stock: available ? Math.floor(Math.random() * 81) : 0,
        shippingDays: Math.floor(Math.random() * 8) + 3, // 3 to 10
      });
    }
  }
  await prisma.productRegion.createMany({ data: productRegionsData });

  // 5. Bundles
  const bundlesData: any[] = [];
  const bundlePairs = new Set<string>();

  for (const leaf of leafCategories) {
    const leafProducts = createdProducts.filter((p) => p.categoryId === leaf.id);
    for (const product of leafProducts) {
      const numBundles = Math.floor(Math.random() * 4) + 1; // 1 to 4
      let added = 0;
      const shuffled = [...leafProducts].sort(() => 0.5 - Math.random());
      
      for (const partner of shuffled) {
        if (added >= numBundles) break;
        if (partner.id === product.id) continue;
        
        const pairKey1 = `${product.id}-${partner.id}`;
        const pairKey2 = `${partner.id}-${product.id}`;
        
        if (!bundlePairs.has(pairKey1) && !bundlePairs.has(pairKey2)) {
          bundlePairs.add(pairKey1);
          bundlesData.push({
            productAId: product.id,
            productBId: partner.id,
            score: Math.random() * 0.6 + 0.3, // 0.3 to 0.9
          });
          added++;
        }
      }
    }
  }
  await prisma.bundle.createMany({ data: bundlesData });

  // 6. Users & Accounts
  const usersToCreate = [
    { email: "admin@amaclone.dev", name: "Store Admin", role: "admin", pass: "admin12345" },
    { email: "shopper@amaclone.dev", name: "Sam Shopper", role: "user", pass: "shopper12345" },
  ];

  for (let i = 1; i <= 8; i++) {
    usersToCreate.push({
      email: `demo${i}@amaclone.dev`,
      name: `Demo User ${i}`,
      role: "user",
      pass: `demo${i}pass`,
    });
  }

  const createdUsers = [];
  for (const u of usersToCreate) {
    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(u.pass);
    
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: u.email,
        name: u.name,
        role: u.role,
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
    
    createdUsers.push(user);
  }

  // 7. Reviews
  const reviewComments = [
    "Great product, highly recommend!",
    "Not bad, but could be better.",
    "Exactly what I was looking for.",
    "Terrible quality, broke after a week.",
    "Good value for the price.",
    "Fast shipping and works perfectly.",
    "I love this so much!",
    "Decent, does the job.",
  ];

  const reviewsData: any[] = [];
  for (const product of createdProducts) {
    const numReviews = Math.floor(Math.random() * 11) + 2; // 2 to 12
    const shuffledUsers = [...createdUsers].sort(() => 0.5 - Math.random()).slice(0, numReviews);
    
    let totalRating = 0;
    for (const user of shuffledUsers) {
      // mostly 4-5, some 3, few 1-2
      const rand = Math.random();
      let rating = 5;
      if (rand < 0.1) rating = 1;
      else if (rand < 0.2) rating = 2;
      else if (rand < 0.4) rating = 3;
      else if (rand < 0.7) rating = 4;
      
      totalRating += rating;
      
      reviewsData.push({
        productId: product.id,
        userId: user.id,
        rating,
        title: rating >= 4 ? "Awesome!" : rating <= 2 ? "Disappointed" : "It's okay",
        comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
      });
    }
    
    const ratingAvg = Math.round((totalRating / numReviews) * 10) / 10;
    await prisma.product.update({
      where: { id: product.id },
      data: { ratingAvg, ratingCount: numReviews },
    });
  }
  await prisma.review.createMany({ data: reviewsData });

  // 8. Orders
  const shopper = createdUsers.find((u) => u.email === "shopper@amaclone.dev")!;
  const usRegion = regions.find((r) => r.code === "US")!;
  
  const address = await prisma.address.create({
    data: {
      userId: shopper.id,
      line1: "123 Main St",
      city: "Seattle",
      postalCode: "98101",
      regionId: usRegion.id,
      isDefault: true,
    },
  });

  const numOrders = Math.floor(Math.random() * 2) + 2; // 2 to 3
  let orderCount = 0;
  for (let i = 0; i < numOrders; i++) {
    const numItems = Math.floor(Math.random() * 3) + 2; // 2 to 4
    const orderProducts = [...createdProducts].sort(() => 0.5 - Math.random()).slice(0, numItems);
    
    let subtotalCents = 0;
    const itemsData = orderProducts.map((p) => {
      const quantity = Math.floor(Math.random() * 3) + 1;
      subtotalCents += p.basePriceCents * quantity;
      return {
        productId: p.id,
        titleSnapshot: p.title,
        imageSnapshot: p.imageUrl,
        unitPriceCents: p.basePriceCents,
        quantity,
      };
    });
    
    const shippingCents = 500;
    const totalCents = subtotalCents + shippingCents;
    
    await prisma.order.create({
      data: {
        userId: shopper.id,
        regionId: usRegion.id,
        addressId: address.id,
        addressSnapshot: {
          line1: address.line1,
          city: address.city,
          postalCode: address.postalCode,
        },
        subtotalCents,
        shippingCents,
        totalCents,
        currencyCode: "USD",
        fxRateUsed: 1,
        items: {
          create: itemsData,
        },
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
  console.log(`Reviews: ${reviewsData.length}`);
  console.log(`Orders: ${orderCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
