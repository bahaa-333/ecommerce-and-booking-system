# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is a Laravel 12 application. The central + tenant-schema database (see "Database architecture" below), Sanctum SPA auth, role-gated admin CRUD for tenants/business types, tenant provisioning, public tenant discovery, a tenant-scoped product/service catalog (soft-deletable), order/booking placement, order/booking/payment fulfillment (status transitions, mark-paid), staff management, and service-time-slot scheduling (with per-slot staff eligibility enforced on bookings) are built. Check `database/migrations/`, `app/Models/`, and `routes/api.php` for the current state rather than assuming this doc stays in sync.

Known gaps as of this writing: the stock-check-then-decrement and booking-capacity-check-then-insert aren't race-safe (no row locking); no image upload endpoint (Cloudinary not wired up); no in-app notifications; no scheduled jobs (e.g. auto-completing past-due bookings); no automated test coverage beyond Laravel's default skeleton tests — everything so far has been verified via manual end-to-end curl testing during development, not a repeatable suite. Also: a product/service's `slug` has a plain (not partial/conditional) unique DB constraint, so a new product can't reuse a soft-deleted one's slug — retiring and replacing a product under the same slug isn't possible right now.

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
- **Provisioning mechanism**: custom-built (no `stancl/tenancy` package) — `App\Services\Tenancy\TenantProvisioner`. `provision(Tenant $tenant)` runs `CREATE SCHEMA IF NOT EXISTS` for `$tenant->schema_name`, then points a dedicated `tenant` DB connection (`config/database.php`, same physical database as `pgsql`, just a runtime-overridden `search_path`) at that schema via `Config::set(...) + DB::purge('tenant')` and runs `php artisan migrate --database=tenant --path=database/migrations/tenant` in-process (`Artisan::call`) — this gives real per-schema migration tracking for free, since Postgres's `search_path` also determines where the migrator's own `migrations` bookkeeping table lands. `deprovision(Tenant $tenant)` runs `DROP SCHEMA ... CASCADE`. Central migrations (`database/migrations/`) and tenant migrations (`database/migrations/tenant/`) stay isolated for free: Laravel's default `migrate` command only globs the top-level `database/migrations/` directory, never the `tenant/` subdirectory.
- `TenantController::store()` derives `schema_name` from the (regex-validated, kebab-case) `slug` as `tenant_{slug_with_underscores}` — never accepted from the request body, since it's an internal Postgres identifier that can't be safely parameter-bound in DDL (`CREATE SCHEMA "..."`); `TenantProvisioner` re-validates the format regardless before ever using it in raw SQL, as defense in depth. Provisioning runs synchronously in the request (not queued) — fine at this scale (a handful of `CREATE TABLE`s), worth revisiting if migrations grow heavy. On provisioning failure the tenant row is deleted (best-effort rollback; not a real cross-connection transaction, since the tenant row and the schema live on two different Laravel DB connections even though it's the same physical database). `destroy()` drops the schema before deleting the row.
- Local dev now points at Postgres (`DB_CONNECTION=pgsql` in `.env`/`.env.example`, database `aligned_tech`). The test suite (`phpunit.xml`) still runs against isolated in-memory SQLite regardless of the dev DB — that's intentional and doesn't need to change.
- Enums are modeled as native PHP backed enums under `app/Enums/` (`PaymentMethod`, `PaymentStatus`, `TransactionStatus`, `CatalogStatus`, `ServiceAvailabilityType`, `TenantStaffRole`) and cast on the relevant Eloquent models — the DB columns themselves are plain `string`, not Postgres native enum types (easier to alter later).

### Central (`public`) schema

- `roles` (`admin`/`customer`/`staff`) — seeded via `RoleSeeder`. `users.role_id` (nullable FK) gives each account one global role.
- `business_types` — lookup table (not an enum) for the 9 supported business models, seeded via `BusinessTypeSeeder`. Descriptive metadata only — every tenant schema gets the same shared-core tables regardless of business type.
- `tenants` — the business registry (`business_type_id`, `schema_name`, `owner_user_id`, `status`).
- `tenant_staff` — records which tenant(s) a staff account works for (`tenant_id`, `user_id`, `role` — tenant-scoped `admin`/`staff`, distinct from the global `users.role_id`). Admins and customers never get a row here; customers place orders/bookings directly via `user_id`, no membership needed.

### Tenant-schema shared core (`database/migrations/tenant/`, run per-tenant by `TenantProvisioner`)

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

- Routing: `bootstrap/app.php` wires `routes/web.php` (HTTP), `routes/api.php` (JSON API for the React frontend), and `routes/console.php` (Artisan commands).
- Middleware and exception handling are configured centrally in `bootstrap/app.php` (via `withMiddleware()` / `withExceptions()`), not in separate Kernel classes — this is the Laravel 11+/12 structure, not the older Laravel 10-style `app/Http/Kernel.php`.
- Models live in `app/Models/`, migrations in `database/migrations/`, factories in `database/factories/`, seeders in `database/seeders/`. Autoloading for `Database\Factories` and `Database\Seeders` is PSR-4 mapped in `composer.json`.
- Config files under `config/` follow standard Laravel conventions (`database.php`, `auth.php`, `queue.php`, etc.) and read from `.env` — check the relevant config file when changing a driver or connection rather than hardcoding values.

## Authentication

- **Laravel Sanctum, SPA (cookie) mode** — the React frontend and API are treated as a first-party pair, not a third-party API consumer. Login/register set an HttpOnly session cookie via CSRF-protected endpoints; there's no bearer token to store in JS. `personal_access_tokens` table exists (Sanctum's standard migration) but isn't used by this flow — only relevant if a future mobile app/third-party client needs real API tokens.
- `config/cors.php` (published, not framework-default) sets `supports_credentials => true` and `allowed_origins` from `FRONTEND_URLS` (comma-separated, no wildcard — required for credentialed CORS). `config/sanctum.php`'s `stateful` domains come from `SANCTUM_STATEFUL_DOMAINS`. Both default to `localhost:5173`/`127.0.0.1:5173` (Vite) in `.env`/`.env.example`.
- `bootstrap/app.php` calls `$middleware->statefulApi()` so `auth:sanctum`-protected routes accept the session cookie from stateful domains.
- `App\Http\Controllers\Api\AuthController`: `register` (always creates a `customer`-role account — admin/staff accounts are never self-service), `login`, `logout`, `me`. Frontend flow: `GET /sanctum/csrf-cookie` first, then `POST /api/register` or `/api/login` with the `X-XSRF-TOKEN` header (axios does this automatically with `withCredentials: true`).
- RBAC: `App\Http\Middleware\EnsureUserHasRole` (aliased `role`) checks `$user->role->slug` against the roles passed to the middleware, e.g. `role:admin`. The `admin/*` route group (`BusinessTypeController`, `TenantController`) runs `['auth:sanctum', 'role:admin']`. This is global-role gating only — it doesn't know about `tenant_staff` membership/tenant-scoped roles, which will need a separate check once tenant-scoped routes exist.

## Tenant-scoped requests

- `App\Http\Controllers\Api\TenantDiscoveryController` (`GET /api/tenants`, optional `?business_type=<slug>`; `GET /api/tenants/{tenant}`) — how a customer finds a business at all, before they know its slug. Public, `status = active` only (the show route reuses `ResolveTenant`'s active-only 404). Response is manually shaped to `id`/`name`/`slug`/`business_type` — deliberately not the raw model, since that also carries `schema_name` and `owner_user_id`, internal/admin-only details with no reason to be public.
- Routes: `/api/tenants/{tenant}/products`, `/services`, `/orders`, `/bookings` (`App\Http\Controllers\Api\Tenant\*`). `{tenant}` is a slug.
- `App\Http\Middleware\ResolveTenant` (aliased `tenant`, applied to the whole route group) looks up the `Tenant` by slug, 404s unless `status = active`, then points the `tenant` DB connection's `search_path` at that tenant's schema for the rest of the request (`Config::set(...) + DB::purge('tenant')` — same technique `TenantProvisioner` uses). All tenant-schema models (`Product`, `Service`, `Order`, `Booking`, etc.) declare `protected $connection = 'tenant'`, so any query they run automatically lands in whichever schema `ResolveTenant` most recently pointed at.
- **Don't type-hint `Tenant $tenant`, or any other scalar/model route parameter, alongside `Request $request` in a tenant-scoped controller method.** Two separate footguns here, both confirmed the hard way:
  1. `SubstituteBindings` runs *before* custom route middleware in Laravel's default priority order, so a type-hinted `Tenant $tenant` parameter makes Laravel try to implicit-bind `{tenant}` by id using the raw slug string and throw. `ResolveTenant` already replaces the route parameter with the resolved model (`$request->route()->setParameter('tenant', $tenant)`), so pull it via `$request->route('tenant')` if a method needs it.
  2. Mixing `Request $request` with a plain scalar parameter (e.g. `int $product`) makes Laravel's controller-method parameter resolution positional instead of name-matched against the route — it silently hands the *wrong* route segment to the scalar parameter (e.g. the `Tenant` model where an `int $order` was expected), producing a `TypeError`, not a validation error. This broke `show`/`update`/`destroy` on every tenant-scoped resource controller until caught by testing. The fix used throughout: methods take only `Request $request` and pull every route segment manually, e.g. `(int) $request->route('product')`.
- `App\Http\Middleware\EnsureTenantAccess` (aliased `tenant.access`, only on catalog/time-slot write routes, after `auth:sanctum` + `tenant`) and the visibility check inside `OrderController`/`BookingController` all call `Tenant::isManagedBy(User $user)`: true for the platform admin, the tenant's `owner_user_id`, or *any* active `tenant_staff` row for that (tenant, user) pair, regardless of that row's `role`. `TenantStaffController::store/update/destroy` (managing the roster itself) instead calls the stricter `Tenant::isAdministeredBy`, which only counts an active `tenant_staff` row with `role = admin` — day-to-day catalog/schedule work and "who else gets access to this tenant" are gated at different levels on purpose.
- `App\Http\Controllers\Api\Tenant\TenantStaffController` (`/staff`): adds an already-registered user as staff directly — no separate invite-and-accept step, `store` just creates the `tenant_staff` row (`isAdministeredBy`-gated). `index` is `isManagedBy`-gated (broader — a plain staff member can see coworkers, not edit the roster).
- `App\Http\Controllers\Api\Tenant\ServiceTimeSlotController` (`/services/{service}/time-slots`): defines a service's availability (`isManagedBy`-gated writes, public `index`). `PUT .../time-slots/{slot}/staff` (`{tenant_staff_ids: [...]}`) replaces the full set of `tenant_staff` assigned to that slot via `sync()` — this is what `BookingController::store` checks against: if a booking specifies both `service_time_slot_id` and `staff_id`, `staff_id` must be assigned to that slot, not just an active staff member of the tenant in general.
- Validation's `unique:tenant.products,slug` / `Rule::unique('tenant.products', 'slug')` — the `tenant.` prefix selects the `tenant` connection (not the table's own name), scoping uniqueness to the current tenant's schema. Verified two different tenants can use the same product slug without colliding, and that a duplicate within the same tenant is still rejected.
- `Product`, `Service`, and `ProductVariant` use `SoftDeletes`. `destroy()` on products/services sets `status` to `CatalogStatus::Archived` *and* soft-deletes — deliberately not a hard delete, since `order_items.product_id`/`bookings.service_id` aren't nullable or cascading (losing a past order/booking's line-item detail on delete would be worse than refusing it, and before this the hard delete would've thrown a raw FK-constraint error instead of failing cleanly). `OrderItem::product()`/`variant()` and `Booking::service()` all call `->withTrashed()`, so historical orders/bookings keep showing full product/service detail after it's archived. **Important**: the `exists:` validation rule queries the raw table and has no idea about `deleted_at` — `OrderController`/`BookingController` use `Rule::exists(...)->whereNull('deleted_at')` instead of the plain string rule specifically so a soft-deleted product/service can't be referenced in a *new* order/booking, even though it's still reachable from old ones.
- Catalog index/show routes are public (no `auth:sanctum`) — browsing needs no login. Orders/bookings are never public: `index`/`show` require `auth:sanctum`, and return only the caller's own records unless `Tenant::isManagedBy` is true, in which case they see every order/booking for that tenant.
- `OrderController::store` and `BookingController::store` run inside `DB::connection('tenant')->transaction(...)` — all the tenant-schema models involved (`Order`, `OrderItem`, `Product`, `Booking`, `Payment`, ...) already use the `tenant` connection, so they automatically participate. Order placement snapshots `unit_price` from the product (or variant, if `has_variants`) at order time, decrements `stock_quantity` where it's tracked (nullable — untracked products skip this), and rejects (rolling back cleanly) if requested quantity exceeds stock. Booking placement derives `ends_at` from `services.duration_value`/`duration_unit` when not given explicitly, rejects bookings inside the service's `advance_booking_value`/`advance_booking_unit` window, and rejects once the count of overlapping non-cancelled bookings reaches `services.capacity` — this is the first real enforcement of capacity/advance-notice; earlier docs had flagged both as unenforced. `staff_id` on a booking is only checked against "active tenant_staff member of this tenant," not per-time-slot eligibility (`service_time_slot_staff`), since there's no endpoint yet for staff to manage which slots they cover.
- Both `store` methods create an associated `Payment` (`status: unpaid`) for the customer-chosen `payment_method` — there's no real payment gateway, `PaymentMethod` is pay-in-person/manual options only.
- Fulfillment: `PATCH .../orders/{order}` and `PATCH .../bookings/{booking}` accept `{status}` only — an order/booking's contents don't change after placement, just its lifecycle. `TransactionStatus::canTransitionTo()` is the shared state machine (`pending` → `confirmed` → `completed`, cancellable up to `completed`; `completed`/`cancelled` are terminal) used by both controllers. The customer who placed it may only cancel; `Tenant::isManagedBy` accounts can make any valid transition. Cancelling an order restores `stock_quantity` for any tracked product/variant in it (it was decremented at placement) — bookings have no equivalent since nothing was decremented. `PATCH .../payments/{payment}` (`{status: paid|unpaid}`) is manager-only — these are pay-in-person methods, so it's staff confirming they received the money, not something a customer self-reports.

## Git conventions

- Do not add a `Co-Authored-By: Claude` (or Anthropic) line to commit messages.
