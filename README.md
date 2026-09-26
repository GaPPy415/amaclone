# amaclone

An Amazon-style marketplace rebuilt as a 24-hour assignment. Browse a seeded catalog,
search it, filter by region, switch currency, read and write reviews, build a cart
(guest or signed-in), check out, and review your orders — plus an admin area for catalog
and role management.

Live demo: _link added at submission time_
Repository: _this repo_

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix), dark/light via next-themes |
| Data | PostgreSQL 16 + Prisma 6 |
| Auth | better-auth (email + password, sessions, admin plugin) |
| Validation | Zod |
| Rate limiting | in-memory sliding window middleware on `/api/*` |
| Packaging | multi-stage Dockerfile (`output: standalone`) + Docker Compose |

## Features

- **Catalog**: 240 seeded products across 34 categories, **arbitrary-depth** browsing
  (materialized path), product pages, featured and newest rails.
- **Search**: case-insensitive title search with filters (availability, price, rating) and sort.
- **Regions**: US / EU / CH / UK. Region gates product **availability** and shipping;
  `product_region` stores per-region stock.
- **Currency**: USD / EUR / CHF / GBP, converted for display from a single USD base price
  via a seeded `fx_rate` table. Orders snapshot the currency and the rate used.
- **Reviews**: 1–5 stars + comment, one per user per product (DB-enforced), aggregates
  recomputed on write.
- **Cart**: works as a guest (cookie-keyed), and **merges** into the signed-in cart on login
  (quantities summed).
- **Checkout**: fake checkout (no payment) — address, review, place order. Orders snapshot
  line title/price and the shipping address, so history never mutates.
- **Orders**: list + detail with immutable snapshots.
- **Wishlist**, **frequently bought together** (seeded co-purchase pairs), **dark/light mode**.
- **Accounts**: email + password sign-up, sign in/out, address book.
- **Admin** (`role = admin`): dashboard, product CRUD, category CRUD, user role management,
  read-only orders. Admin routes are gated server-side and by route guard.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@amaclone.dev` | `admin12345` |
| Customer | `shopper@amaclone.dev` | `shopper12345` |
| Customers | `demo1@amaclone.dev` … `demo8@amaclone.dev` | `demo1pass` … `demo8pass` |

## Run locally (Docker — recommended)

```bash
docker compose up --build
```

- App: http://localhost:3000
- Postgres is published on host port **5433** (5432 is left for any native Postgres).
- The `migrate` service applies migrations and runs the seed before the app starts; the seed
  is idempotent (it exits early if products already exist).
- `docker compose down -v` to wipe the database and re-seed on the next `up`.

## Run locally (without Docker)

```bash
cp .env.example .env      # adjust DATABASE_URL if needed
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | session/cookie signing secret |
| `BETTER_AUTH_URL` | base URL of the app (auth callbacks + CSRF origin) |
| `NEXT_PUBLIC_APP_URL` | public base URL |

## Testing

Local verification used an HTTP QA harness plus `psql` assertions: guest add-to-cart,
login merge (quantities summed), order placement, order-snapshot immutability after a price
change, review submission/duplicate rejection/aggregate recompute, admin gates
(anonymous → sign-in, non-admin → home, admin → page), admin product/role mutations, and
rate limiting (429 with `Retry-After`).

## PostgreSQL replicas

The brief asked for a primary plus replicas. Shipping an HA cluster (Patroni/repmgr) would
have consumed hours for no demo value, so the default stack runs **one primary**, and a
ready-to-enable replica configuration ships in `docker-compose.yml`:

```bash
docker compose --profile replicas up -d
```

- `postgres` runs with `wal_level=replica`, `max_wal_senders=5`, `hot_standby=on` and an
  init script creating a `replicator` role (`docker/postgres/init/01-replicator.sql`).
- `replica-1` / `replica-2` run `docker/postgres/replica/start-replica.sh`, which performs
  `pg_basebackup` and starts the standby.
- Validate without starting them: `docker compose --profile replicas config`.

Read/write splitting is not wired into the app (a read replica would be added by pointing
read queries at a second connection string); the configuration above is the documented path.

## Deployment

Deployed to **Vercel** (app) + **Neon** (Postgres) for the live link, while the repo also
ships full Docker packaging — both the brief's "Docker containers" line and the "public live
link" line are satisfied.

- Set `DATABASE_URL` (Neon **pooled** connection string), `BETTER_AUTH_SECRET`,
  `BETTER_AUTH_URL`, and `NEXT_PUBLIC_APP_URL` in Vercel.
- Apply migrations and seed against the Neon database once:
  `npx prisma migrate deploy && npm run db:seed` (with `DATABASE_URL` pointed at Neon).

## Deliberate cuts

Real payment processing · live FX API · recommendation ML · email verification / password
reset · order tracking · product image upload (URLs only) · coupons · admin analytics ·
inventory reservations · i18n beyond currency display. See `design-system/MASTER.md` for the
design rationale and `.sisyphus/plans/amaclone-build-plan.md` for the full plan.

## Agent capture

Prompt/response capture is installed as an opencode plugin (`.opencode/plugins/agent-capture.ts`)
and writes to `.agent-logs/`, which is committed as part of the submission. See
`CAPTURE-TEST.md` for the mechanism and raw canaries.
