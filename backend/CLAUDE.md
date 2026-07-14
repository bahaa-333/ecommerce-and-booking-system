# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is a Laravel 12 application, currently at the default framework skeleton (stock `User` model/migration, default `welcome` route, no custom domain code yet). Database schema and application features are being built out from here — check `database/migrations/` and `app/Models/` for the current state rather than assuming this doc stays in sync.

## Product overview

An e-commerce + booking platform split into three portals:

- **Admin** — platform-level management, cross-tenant.
- **Customer** — browses/orders/books with a tenant business.
- **Staff** — operates day-to-day within a tenant business (fulfilling orders, managing bookings/schedules).

Access across all three portals is role-based (RBAC) — permissions differ by role, not just by portal.

The platform is multi-tenant: each tenant is a business, and a tenant can operate under one of several business models, each with different data needs:

- Retail shop
- Restaurant
- Cafe
- Salon / barber
- Gym
- Hotel
- Guest house
- Events
- Workshops

Rather than a separate set of tables per business model, the schema uses one generalized shared core per tenant: **products** (buy-now goods — retail items, menu items, retail add-ons) and **services** (bookable offerings — salon/gym treatments, hotel rooms, event/workshop sessions all fit the same shape: price, capacity, duration, advance-booking notice). See "Database architecture" below for the full table breakdown.

## Database architecture

- **Engine**: PostgreSQL.
- **Multi-tenancy strategy**: schema-per-tenant — each tenant (business) gets its own Postgres schema, rather than a shared-schema `tenant_id` column approach. The central `public` schema holds cross-tenant data; tenant schemas hold that business's operational data. Because both live in the *same physical database*, tenant-schema tables can (and do) hold real Postgres FK constraints back to central tables, e.g. `orders.user_id` → `public.users.id`, via schema-qualified references (`$table->foreignId(...)->constrained('public.users')`).
- **Provisioning mechanism**: custom-built (no `stancl/tenancy` package), not yet implemented — creating a tenant's schema and running `database/migrations/tenant/` against it via `search_path` switching is still to be built. Central migrations (`database/migrations/`) and tenant migrations (`database/migrations/tenant/`) are already isolated for free: Laravel's `migrate` command only globs the top-level `database/migrations/` directory, so it never picks up the `tenant/` subdirectory.
- Local dev now points at Postgres (`DB_CONNECTION=pgsql` in `.env`/`.env.example`, database `aligned_tech`). The test suite (`phpunit.xml`) still runs against isolated in-memory SQLite regardless of the dev DB — that's intentional and doesn't need to change.
- Enums are modeled as native PHP backed enums under `app/Enums/` (`PaymentMethod`, `PaymentStatus`, `TransactionStatus`, `CatalogStatus`, `ServiceAvailabilityType`, `TenantStaffRole`) and cast on the relevant Eloquent models — the DB columns themselves are plain `string`, not Postgres native enum types (easier to alter later).

### Central (`public`) schema

- `roles` (`admin`/`customer`/`staff`) — seeded via `RoleSeeder`. `users.role_id` (nullable FK) gives each account one global role.
- `business_types` — lookup table (not an enum) for the 9 supported business models, seeded via `BusinessTypeSeeder`. Descriptive metadata only — every tenant schema gets the same shared-core tables regardless of business type.
- `tenants` — the business registry (`business_type_id`, `schema_name`, `owner_user_id`, `status`).
- `tenant_staff` — records which tenant(s) a staff account works for (`tenant_id`, `user_id`, `role` — tenant-scoped `admin`/`staff`, distinct from the global `users.role_id`). Admins and customers never get a row here; customers place orders/bookings directly via `user_id`, no membership needed.

### Tenant-schema shared core (`database/migrations/tenant/`, not yet run against any real schema)

- `products` (buy-now goods, `has_variants` flag) + `product_images` (Cloudinary URLs — max 4 per product, app-enforced, not a DB constraint) + `product_options`/`product_option_values` (e.g. "Size" → Small/Medium/Large — option groups, just labeled choices) + `order_items` + `orders` — line-item purchase flow. `orders.user_id` → `public.users`; `order_items.product_id` → `products` directly (no polymorphism, one buyable type per tenant). When `products.has_variants` is true, `product_variants` holds the actual purchasable combinations (own `price`/`stock_quantity`/`description`, plus `product_variant_images`), linked to the option values that make up each combination via `product_variant_option_values` (e.g. variant = {Size: Large, Color: Red}); `order_items.product_variant_id` (nullable) records which variant was bought, when applicable.
- `services` (bookable offerings — generalizes salon/gym/hotel/event offerings into one table: `capacity`, `duration_value`+`duration_unit`, `advance_booking_value`+`advance_booking_unit` — unit is `minutes`/`hours`/`days` via the `DurationUnit` enum, so a haircut can be "60 minutes" and a hotel stay "1 days" without forcing everything into a minutes integer) + `service_images` (same Cloudinary/max-4 pattern as products) + `service_time_slots` (recurring or date-range availability windows, `availability_type` enum) + `service_time_slot_staff` (pivot: which `tenant_staff` can cover which time slot) + `bookings` — appointment flow. `bookings.service_id` is a direct FK (a booking is always for one service); `bookings.staff_id` (nullable) → `public.tenant_staff`, `bookings.service_time_slot_id` (nullable) records which availability rule was used.
- `payments` — polymorphic `payable_type`/`payable_id` (covers either an `order` or a `booking`).
- Capacity/staff-availability enforcement (e.g. "no more than N overlapping bookings for this service") is an application-level rule, not a DB constraint.

## Stack

- PHP 8.2+, Laravel 12
- DB: PostgreSQL, schema-per-tenant — see "Database architecture" above.
- Frontend build: Vite + Tailwind CSS 4 (`vite.config.js`, `package.json`)
- Testing: PHPUnit via `php artisan test` (not Pest — `pestphp` is not installed)
- Queue/cache/session drivers default to `database` in `.env.example`

## Commands

Setup (fresh clone):
```
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm install
```

Run the app (server + queue worker + log tailing + Vite, concurrently):
```
composer dev
```

Run just the PHP dev server:
```
php artisan serve
```

Frontend asset build:
```
npm run dev      # Vite dev server
npm run build    # production build
```

Tests:
```
composer test              # clears config cache, then runs php artisan test
php artisan test
php artisan test --filter=TestName    # single test method or class
php artisan test tests/Feature/ExampleTest.php   # single file
```

Migrations:
```
php artisan make:migration create_x_table
php artisan migrate
php artisan migrate:fresh          # drop all tables and re-migrate
php artisan migrate:fresh --seed   # drop, re-migrate, and seed
php artisan migrate:rollback
```

Other Artisan generators (standard Laravel conventions):
```
php artisan make:model X -mfs      # model + migration + factory + seeder
php artisan make:controller XController
php artisan tinker                 # REPL against the app
```

Linting/formatting:
```
vendor/bin/pint        # Laravel Pint (PSR-12-based code style)
```

## Architecture notes

- Routing: `bootstrap/app.php` wires `routes/web.php` (HTTP) and `routes/console.php` (Artisan commands); there is no `routes/api.php` yet — add it via `withRouting()` in `bootstrap/app.php` if/when an API surface is introduced.
- Middleware and exception handling are configured centrally in `bootstrap/app.php` (via `withMiddleware()` / `withExceptions()`), not in separate Kernel classes — this is the Laravel 11+/12 structure, not the older Laravel 10-style `app/Http/Kernel.php`.
- Models live in `app/Models/`, migrations in `database/migrations/`, factories in `database/factories/`, seeders in `database/seeders/`. Autoloading for `Database\Factories` and `Database\Seeders` is PSR-4 mapped in `composer.json`.
- Config files under `config/` follow standard Laravel conventions (`database.php`, `auth.php`, `queue.php`, etc.) and read from `.env` — check the relevant config file when changing a driver or connection rather than hardcoding values.

## Authentication

- **Laravel Sanctum, SPA (cookie) mode** — the React frontend and API are treated as a first-party pair, not a third-party API consumer. Login/register set an HttpOnly session cookie via CSRF-protected endpoints; there's no bearer token to store in JS. `personal_access_tokens` table exists (Sanctum's standard migration) but isn't used by this flow — only relevant if a future mobile app/third-party client needs real API tokens.
- `config/cors.php` (published, not framework-default) sets `supports_credentials => true` and `allowed_origins` from `FRONTEND_URLS` (comma-separated, no wildcard — required for credentialed CORS). `config/sanctum.php`'s `stateful` domains come from `SANCTUM_STATEFUL_DOMAINS`. Both default to `localhost:5173`/`127.0.0.1:5173` (Vite) in `.env`/`.env.example`.
- `bootstrap/app.php` calls `$middleware->statefulApi()` so `auth:sanctum`-protected routes accept the session cookie from stateful domains.
- `App\Http\Controllers\Api\AuthController`: `register` (always creates a `customer`-role account — admin/staff accounts are never self-service), `login`, `logout`, `me`. Frontend flow: `GET /sanctum/csrf-cookie` first, then `POST /api/register` or `/api/login` with the `X-XSRF-TOKEN` header (axios does this automatically with `withCredentials: true`).
- The `admin/*` routes (`BusinessTypeController`, `TenantController`) are not yet gated by role — that's the next step (RBAC middleware/policies), tracked via `TODO` comments in those controllers.

## Git conventions

- Do not add a `Co-Authored-By: Claude` (or Anthropic) line to commit messages.
