# amaclone — Build Plan (24h Amazon.com Rebuild)

Status: **locked decisions, ready to execute**
Owner: David · Tool: opencode (Sisyphus) · Capture: `agent-capture` plugin → `.agent-logs/` (verified live)

---

## 1. Assignment contract (what is graded)

| Graded on | What that means for the plan |
|---|---|
| **Speed** — working product per hour | Deploy a walking skeleton on hour 1; ship vertical slices, never horizontal layers. |
| **Product judgement** — what's first / what's cut | Build the buy path (catalog → cart → checkout → orders) before anything decorative. Document cuts. |
| **UX / UI** — is it good to use | ui-ux-pro-max design system locked before components; dark mode parity + responsive + a11y from the start, not bolted on. |

**Hard deliverables (non-negotiable):**
1. Public **live link** that opens for a signed-out stranger.
2. Public **repo** with `.agent-logs/` committed (as we go, interleaved with code — not one dump).
3. **`CAPTURE-TEST.md`** — already done and committed.
4. **Loom walkthrough** ≤5 min, camera on.

---

## 2. Locked decisions

| # | Decision | Choice | Notes |
|---|---|---|---|
| D1 | Deployment | **Vercel (app) + Neon (Postgres)** for the live link, **plus full Docker packaging in-repo** | Reconciled: Docker must exist in the repo because the brief says so. See §3. |
| D2 | Postgres replicas | **Single primary now; replica config shipped + documented** | Brief's spirit honored; no Patroni/repmgr time sink. See §7. |
| D3 | Region semantics | **Availability + shipping only** | Region gates buyability/shipping; price is global. `product_region` join. |
| D4 | Category depth | **Arbitrary depth** | Adjacency list + materialized `path` for breadcrumbs/filtering. |
| D5 | Cart | **Guest cookie cart, merged into user cart on login** | DB-backed cart for authed users; guest cart keyed by cookie token. |
| D6 | Checkout | **Fake checkout, no payment** | Address → review → place order; order persisted; UI labeled as demo. |
| D7 | Recon | **Skipped** | Build from known Amazon patterns + feature list. |
| D8 | Reviews | Login required; 1–5 stars + comment; **no** verified-purchase gate | One review per user per product. |
| D9 | Admin | Products + categories + user-role CRUD (add/manage admins) | Plus read-only orders view. |
| D10 | Currency | Base **USD cents** + static `fx_rate` table; **display-only** conversion (USD, EUR, CHF, GBP) | No live FX API. |
| D11 | Search | Postgres `ILIKE` + `pg_trgm` similarity | No search service. |
| D12 | Frequently bought together | Seeded/precomputed co-purchase pairs; fallback same-category | No recommendation engine. |
| D13 | Email | **No email sending**; no verification, no reset | Signup is email+password only, immediate session. |
| D14 | Password hashing | scrypt (better-auth default) or bcryptjs | Prefer built-in; do not hand-roll. |

---

## 3. Deployment architecture (resolves D1)

```
┌──────────────────── LIVE (public URL) ─────────────────────┐
│  Vercel  ── Next.js 16 app (serverless + edge middleware)   │
│     │                                                       │
│     └──► Neon Postgres (managed, pooled connection)         │
└─────────────────────────────────────────────────────────────┘

┌──────────────────── REPO (Docker packaging) ───────────────┐
│  docker-compose.yml                                         │
│    app        → multi-stage Dockerfile (standalone)         │
│    postgres   → postgres:16-alpine + volume + healthcheck   │
│    (replica)  → documented, profile-gated, not default      │
│  Same image runs anywhere: `docker compose up`              │
└─────────────────────────────────────────────────────────────┘
```

- Vercel is the **live link**; Docker is the **shipped artifact**. Both requirements met.
- Migrations: `prisma migrate deploy` as Vercel postinstall/predeploy and in the Docker entrypoint.
- Neon connection: use the **pooled** connection string for the app; direct string for migrations.

---

## 4. Stack

| Layer | Choice | Version (Sep 2026) |
|---|---|---|
| Framework | Next.js App Router (TypeScript) | 16.3.x |
| UI runtime | React | 19.3.x |
| Styling | Tailwind CSS | 4.3.x |
| Components | shadcn/ui (Radix) | 4.19.x |
| Icons | lucide-react | latest |
| Theming | next-themes (dark/light) | latest |
| ORM | Prisma + `@prisma/client` | 7.10.x |
| DB | PostgreSQL | 16 |
| Auth | better-auth (+ admin plugin) | 1.6.x |
| Validation | Zod | latest |
| Rate limit | in-memory sliding window in middleware; optional Upstash | — |
| Notifications | sonner (toasts) | latest |

**Not using**: a separate backend (Hono/Express/FastAPI) — Next route handlers + server actions remove an entire deploy surface for zero benefit at this scale.

---

## 5. Data model (Prisma sketch)

Auth tables (`user`, `session`, `account`, `verification`) are owned by better-auth; we extend `user` with app fields. Domain tables:

```prisma
model User {            // better-auth-managed + app fields
  id        String   @id
  email     String   @unique
  name      String?
  role      String   @default("user")   // "user" | "admin"
  createdAt DateTime @default(now())
  addresses Address[]
  orders    Order[]
  reviews   Review[]
  wishlist  WishlistItem[]
  cart      Cart?
}

model Region {
  id           String @id @default(cuid())
  code         String @unique    // "US","EU","CH","UK"
  name         String
  currencyCode String            // "USD","EUR","CHF","GBP"
  isActive     Boolean @default(true)
  products     ProductRegion[]
  addresses    Address[]
  orders       Order[]
}

model Address {
  id         String  @id @default(cuid())
  userId     String
  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  label      String?
  line1      String
  line2      String?
  city       String
  postalCode String
  regionId   String
  region     Region  @relation(fields: [regionId], references: [id])
  isDefault  Boolean @default(false)
  orders     Order[]
}

model Category {
  id        String     @id @default(cuid())
  name      String
  slug      String     @unique
  parentId  String?
  parent    Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryTree")
  path      String     @default("")   // materialized slug path, e.g. "electronics/pc-video-games"
  position  Int        @default(0)
  products  Product[]
}

model Product {
  id             String   @id @default(cuid())
  slug           String   @unique
  title          String
  description    String
  brand          String?
  categoryId     String
  category       Category @relation(fields: [categoryId], references: [id])
  basePriceCents Int                       // USD cents — single source of truth
  imageUrl       String
  ratingAvg      Float    @default(0)      // denormalized from reviews
  ratingCount    Int      @default(0)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  regions        ProductRegion[]
  reviews        Review[]
  orderItems     OrderItem[]
  wishlistedBy   WishlistItem[]
  cartItems      CartItem[]
  bundlesA       Bundle[] @relation("BundleA")
  bundlesB       Bundle[] @relation("BundleB")
}

model ProductRegion {
  productId    String
  regionId     String
  product      Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  region       Region  @relation(fields: [regionId], references: [id], onDelete: Cascade)
  available    Boolean @default(true)
  stock        Int     @default(0)
  shippingDays Int     @default(5)
  @@id([productId, regionId])
}

model Review {
  id        String   @id @default(cuid())
  productId String
  userId    String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  rating    Int      // 1..5, validated in app
  title     String?
  comment   String
  createdAt DateTime @default(now())
  @@unique([productId, userId])
  @@index([productId, createdAt])
}

model Cart {
  id         String     @id @default(cuid())
  userId     String?    @unique
  user       User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  guestToken String?    @unique
  updatedAt  DateTime   @updatedAt
  items      CartItem[]
}

model CartItem {
  id        String  @id @default(cuid())
  cartId    String
  productId String
  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity  Int     @default(1)
  @@unique([cartId, productId])
}

model WishlistItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([userId, productId])
}

model Order {
  id             String      @id @default(cuid())
  userId         String
  user           User        @relation(fields: [userId], references: [id])
  status         String      @default("placed")  // placed|shipped|delivered|cancelled
  regionId       String
  region         Region      @relation(fields: [regionId], references: [id])
  addressId      String?
  addressSnapshot Json                        // snapshot: layout changes must not rewrite history
  subtotalCents  Int
  shippingCents  Int         @default(0)
  totalCents     Int
  currencyCode   String      @default("USD")  // currency shown at order time
  fxRateUsed     Float       @default(1)      // rate at order time
  createdAt      DateTime    @default(now())
  items          OrderItem[]
  @@index([userId, createdAt])
}

model OrderItem {
  id             String  @id @default(cuid())
  orderId        String
  order          Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId      String
  product        Product @relation(fields: [productId], references: [id])
  titleSnapshot  String                    // price/title snapshots — orders must never mutate
  imageSnapshot  String
  unitPriceCents Int
  quantity       Int
}

model FxRate {
  currencyCode String @id               // "EUR","CHF","GBP"
  rateFromUsd  Float                    // 1 USD = rateFromUsd units
  updatedAt    DateTime @default(now())
}

model Bundle {
  id        String  @id @default(cuid())
  productAId String
  productBId String
  score     Float   @default(0)         // co-purchase strength
  productA  Product @relation("BundleA", fields: [productAId], references: [id], onDelete: Cascade)
  productB  Product @relation("BundleB", fields: [productBId], references: [id], onDelete: Cascade)
  @@unique([productAId, productBId])
}
```

**Why these structural choices (vs the original proposal):**
- `OrderItem.titleSnapshot` / `unitPriceCents` — orders are immutable history. Without snapshots, changing a product price rewrites the past.
- `Order.addressSnapshot` (JSON) — same reason; addresses get edited/deleted.
- `Order.fxRateUsed` — an order placed in EUR stays stable even if the static rate changes.
- `ProductRegion` — required because region is per-product availability, not a column.
- `Review @@unique([productId, userId])` — prevents review spam at the DB level.
- `Category.path` — materialized slug path makes arbitrary-depth breadcrumbs and subtree filters a single indexed `LIKE 'path%'` instead of recursive CTEs on every request. Recursive CTE still used once for seeding/rebuilds.
- `Product.ratingAvg/ratingCount` denormalized — recomputed on review write; avoids aggregate queries on every listing.

---

## 6. Routes & pages

**Public**
- `/` — home: hero, category nav (top-level), deals rail, "recently viewed"
- `/category/[...slug]` — arbitrary-depth category browse + filters (region availability, price range, rating, sort)
- `/search?q=` — trigram/ILIKE search results
- `/product/[slug]` — gallery, buy box (price in active currency, region availability, add-to-cart, add-to-wishlist), reviews list + rate, **frequently bought together**
- `/cart` — guest or authed
- `/checkout` — address select/create → review → place order
- `/orders`, `/orders/[id]` — list + detail
- `/wishlist`
- `/account` — profile, addresses CRUD, sign out
- `/sign-in`, `/sign-up`

**Admin** (role-gated)
- `/admin` — dashboard (counts)
- `/admin/products`, `/admin/products/new`, `/admin/products/[id]`
- `/admin/categories` — tree CRUD
- `/admin/users` — promote/demote admin
- `/admin/orders` — read-only list/detail

**API / handlers**
- `/api/auth/[...all]` (better-auth)
- `/api/health` (for Docker healthcheck + uptime)
- Server actions for cart, wishlist, checkout, reviews, admin mutations
- `middleware.ts` — rate limiting + session/admin route protection

---

## 7. Postgres replicas — how D2 is honored

- `docker-compose.yml` ships a **`replica` service behind a compose profile** (`--profile replicas`), with the `postgresql.conf` replication settings committed.
- Default `docker compose up` starts **only** `app` + `postgres` — fast, reliable demo.
- `README.md` documents the exact steps to bring replicas up and how the app would point read traffic at them (`REPLICA_DATABASE_URL`, Prisma read-replica split). This is the "one command away" state — the requirement is visibly addressed without burning 4–8h.
- No Patroni/repmgr/etcd. Explicitly out of scope for a 24h build.

---

## 8. Docker packaging

- `next.config.ts` → `output: "standalone"`.
- Multi-stage `Dockerfile`: `deps` (npm ci) → `builder` (build) → `runner` (node:24-alpine, non-root user, `/api/health` HEALTHCHECK).
- `.dockerignore`: `node_modules`, `.next`, `.git`, `.env*`, logs, coverage.
- `docker-compose.yml`: `postgres` (healthcheck + named volume) + `app` (`depends_on: service_healthy`) + profile-gated `replica`.
- Entrypoint runs `prisma migrate deploy` (+ idempotent seed guarded by a count check), then `node server.js`.
- Image is deployable as-is to any container host — Vercel is just the chosen live target.

---

## 9. Design system (ui-ux-pro-max, locked before components)

1. Run `--design-system` for `"e-commerce marketplace amazon content-dense trustworthy"` with `--persist -p "amaclone"` to generate `design-system/MASTER.md`.
2. Grab `--domain landing`, `--domain color` (ecommerce), `--domain typography`, `--domain ux "search loading accessibility"`.
3. Commit `MASTER.md`; every page build reads it (and any `design-system/pages/*.md` override) first.
4. Non-negotiables from the skill: **no emoji as icons** (lucide SVG only), semantic color tokens (no raw hex), 4/8px spacing rhythm, ≥44px touch targets, visible labels, focus rings, `prefers-reduced-motion`, **dark mode designed in parallel** (not inverted), contrast ≥4.5:1 in both themes.

---

## 10. Build phases (hour blocks; not expected to use all 24)

| Phase | Hours | Deliverable | Commit checkpoint |
|---|---|---|---|
| 0. Skeleton | 0:00–0:45 | Next 16 + Tailwind + shadcn + Prisma init; `ui-ux-pro-max --design-system` → MASTER.md; Dockerfile + compose; **hello world on Vercel + Neon** | "scaffold + design system" |
| 1. Data + auth | 0:45–2:30 | better-auth email/password + admin role; full schema migrated; **seed**: ~12 categories (nested), ~120 products w/ images, 4 regions, `product_region`, fx rates, bundles, sample reviews/orders | "schema, auth, seed" |
| 2. Catalog (buy-path first) | 2:30–6:00 | Home, category tree (arbitrary depth) + filters, search (pg_trgm), product page (region availability, currency display, review list) | "catalog" |
| 3. Commerce core | 6:00–9:30 | Guest cart (cookie) → merge on login; wishlist; checkout (fake) → order with snapshots; orders list/detail | "cart, checkout, orders" |
| 4. Engagement | 9:30–12:00 | Review write flow (+rating recompute), frequently-bought-together, region selector + currency switcher in header | "reviews, bundles, region/currency" |
| 5. Admin + security | 12:00–14:30 | Admin CRUD (products/categories/users/orders view), admin gating, rate limiting | "admin + rate limit" |
| 6. Polish | 14:30–18:00 | Dark/light audit, responsive audit, loading/empty/error states, a11y pass (§9 checklist), micro-interactions | "polish" |
| 7. Docker verify | 18:00–19:30 | Clean `docker compose up` end-to-end, replica profile documented, README | "docker + docs" |
| 8. Ship | 19:30–22:00 | Production seed, signed-out smoke test of every flow on the live URL, fix regressions | "deploy" |
| 9. Package | 22:00–24:00 | Loom ≤5 min (camera on), link/repo fields labeled, final `.agent-logs/` commit | "submission" |

**Rule throughout:** commit `.agent-logs/` interleaved with the code of each phase, not at the end.

**Gate rule:** a phase is not complete until its QA scenario below passes. Run it before starting the next phase.

---

## 10.1 Per-phase QA scenarios (executable)

Tools: `curl`, `docker compose`, `npx prisma`, `npm run build`, and **Playwright / agent-browser** for browser flows. `$LIVE` = Vercel URL; `$LOCAL` = `http://localhost:3000`.

**Phase 0 — Skeleton**
- `docker compose up --build -d` then `docker compose ps` → `app` and `postgres` both `healthy`/`running`.
- `curl -s -o /dev/null -w "%{http_code}" $LOCAL/api/health` → `200`; body `{"status":"ok"}`.
- `curl -sI $LIVE/` → `200` (live walking skeleton reachable).
- `design-system/MASTER.md` exists and is non-empty.

**Phase 1 — Data + auth**
- `npx prisma migrate deploy` → exit 0. `npx prisma db seed` → exit 0 (re-run twice; second run must not duplicate — idempotent).
- `curl -s "$LIVE/api/products" | jq '.items|length'` → `>= 100`.
- Recursive CTE check: `SELECT max(depth) FROM (...)` over categories → `>= 2`; category count `>= 12`.
- Sign-up `curl -X POST .../api/auth/sign-up/email` (valid) → `200/201` + session cookie. Same email again → `4xx` (duplicate).
- Sign-in with wrong password → `401`; correct → session cookie. Sign-out → subsequent `/api/auth/get-session` returns unauthenticated.
- Seeded admin: `SELECT role FROM "user" WHERE email='admin@...'` → `admin`.

**Phase 2 — Catalog**
- `curl -s -o /dev/null -w "%{http_code}" $LOCAL/category/electronics/pc-video-games` → `200` (arbitrary-depth path resolves).
- Playwright: homepage → click a top-level category → click a nested child → breadcrumb shows both levels → click a product → product title + price + add-to-cart visible.
- `/search?q=<seeded term>` lists matching products; `/search?q=zzzznotathing` shows the empty state (not a 500).
- Product page renders region availability and existing reviews.

**Phase 3 — Commerce core**
- Guest adds item with no session → cart shows it and `cart_token` cookie is set.
- Log in (or sign up) in the same browser → cart contents survive and quantities for the same product are summed, capped at stock.
- Place order → `orders` row + `order_items` exist; `/orders` lists it; `/orders/[id]` shows it.
- Snapshot proof: `UPDATE "Product" SET basePriceCents=...` after ordering, reload `/orders/[id]` → displayed line price/title unchanged.

**Phase 4 — Engagement**
- Submit review (rating 1–5 + comment) → appears on product page; product `ratingAvg`/`ratingCount` updated.
- Submit a second review as the same user → rejected (unique constraint), no duplicate row.
- A seeded product shows `>= 1` frequently-bought-together item.
- Currency switch USD→EUR→CHF→GBP changes displayed prices consistent with `fx_rate`; region switch flips a product between available/unavailable with a visible indicator.

**Phase 5 — Admin + security**
- Signed-out `GET /admin` → redirect to sign-in (or `403`).
- Non-admin signed-in `GET /admin` → `403`/redirect; admin `GET /admin` → `200`.
- Admin creates a product → it appears in the public catalog. Admin promotes a user → that user's `role` becomes `admin`.
- Rate limit: fire 100 rapid requests at an API route → at least one `429` with a `Retry-After` header.

**Phase 6 — Polish**
- Playwright at 375px width: no horizontal scroll on home/category/PDP/cart; nav usable.
- Dark mode toggled on every route: body text contrast `>= 4.5:1`; no icon-only control without an accessible name.
- `npm run build` → exit 0, no type errors; `lsp_diagnostics` clean on changed files.
- `prefers-reduced-motion: reduce` → non-essential animations suppressed.

**Phase 7 — Docker verify**
- `docker compose down -v` then `docker compose up --build` → healthcheck `healthy`.
- `curl -s $LOCAL/api/health` → `200`; run the Phase 3 buy flow against the containerized app.
- `docker compose --profile replicas config` → replica service is defined/valid; the README replica steps run without error.

**Phase 8 — Ship**
- Fresh incognito session against `$LIVE` (signed out): home → category → search → product → cart → sign-up → checkout → order → review → wishlist → account all succeed.
- Vercel deployment has no build/runtime errors; Neon contains seeded + newly created data.
- `curl -s $LIVE/api/health` → `200` from an external network.

**Phase 9 — Package**
- Loom file duration `<= 5:00`, camera visible.
- `curl -sI https://github.com/<user>/amaclone` → `200` (public); GitHub contents API lists `.agent-logs/`.
- Submission link/repo fields are labeled.

---

## 11. Cut list (explicit, documented in README)

Real payments · live FX API · recommendation ML · email verification/reset · order tracking/shipping integration · product image upload (URLs only) · coupons/promotions · admin analytics charts · multi-address shipping split · inventory reservations · i18n beyond currency display.

---

## 12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Vercel vs "Docker" grading line (D1) | Hybrid: Docker artifact shipped + Vercel live link. Called out in README. |
| Windows + Next 16 + Prisma junction/symlink error | Enable Developer Mode or run elevated; `prisma generate` before dev; `turbo.resolveSymlinks=false` fallback. |
| npm peer-dep conflicts (React 19 + shadcn) | Use `--legacy-peer-deps` for shadcn add, or commit `.npmrc`. |
| Arbitrary-depth category UI (D4) | Materialized `path` for reads; recursive CTE only in seed/rebuild; tree rendered from a single flat fetch. |
| Guest-cart merge edge cases (D5) | Merge = sum quantities, cap at stock, resolve conflicts on `(cartId, productId)` unique; test explicitly. |
| Neon cold start / connection limits | Use pooled connection string; `?pgbouncer=true`. |
| Serverless in-memory rate limit is per-instance | Accept for demo; Upstash optional if budget allows. |
| Seed data volume makes the site look real | Seed script is a first-class phase-1 deliverable, not an afterthought. |
| Loom over 5 min / no camera | Script it to ≤5 min; camera check before recording. |

---

## 13. Definition of done (executable)

Each item is a check, not a sentiment. Run them in order at the end; all must pass.

1. **Live, signed-out reachable** — `curl -s -o /dev/null -w "%{http_code}" $LIVE/` → `200`, and `curl -s $LIVE/api/health` → `{"status":"ok"}`.
2. **Full buy path in a fresh incognito browser** (Playwright, no session): home → category (nested) → search → product → add to cart → sign-up → checkout → place order → order visible under `/orders` → submit a review → toggle wishlist → open `/account`. Every step asserts a concrete DOM/URL outcome; any failure fails the check.
3. **Order immutability** — after ordering, change the product's `basePriceCents`; `GET /orders/<id>` still shows the original snapshot price/title.
4. **Admin** — signed-out `/admin` → redirect/`403`; admin `/admin` → `200`; admin creates a product that appears in the public catalog; admin promotes a user whose `role` then reads `admin`.
5. **Region + currency** — switching region flips at least one product available↔unavailable with a visible indicator; switching currency changes displayed prices per `fx_rate`.
6. **Dark/light** — toggle works on every route; sampled body text contrast `>= 4.5:1` in both themes; no unlabeled icon-only controls.
7. **Rate limiting** — 100 rapid API requests produce at least one `429` with `Retry-After`.
8. **Docker** — from `docker compose down -v`: `docker compose up --build` reaches `healthy`, `/api/health` → `200`, and the buy path works against the container. `docker compose --profile replicas config` validates.
9. **Build clean** — `npm run build` exit 0 and `lsp_diagnostics` clean on changed files.
10. **Submission artifacts** — public repo `200` with `.agent-logs/` present (GitHub contents API), `CAPTURE-TEST.md` present, Loom `<= 5:00` with camera on, link/repo fields labeled.
11. **README** documents stack, deploy steps, the replica bring-up path, and the explicit cut list.
