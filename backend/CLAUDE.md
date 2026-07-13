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

Because these business models differ substantially (e.g. inventory + orders for retail vs. appointment slots for salon/gym vs. room/date bookings for hotel/guest house), expect the schema to have a shared core (tenants, users, roles, payments) plus per-business-model extensions rather than one flat set of tables.

## Database architecture

- **Engine**: PostgreSQL.
- **Multi-tenancy strategy**: schema-per-tenant — each tenant (business) gets its own Postgres schema, rather than a shared-schema `tenant_id` column approach. A central/public schema is expected to hold cross-tenant data (tenant registry, platform admins, global lookups); tenant schemas hold that business's operational data.
- Implication for migrations: schema-per-tenant means migrations need to run per-tenant-schema (not just once against `public`), and provisioning a new tenant means creating a schema and running the tenant migration set against it. This isn't stock Laravel behavior — the concrete provisioning/migration mechanism is still to be decided as this is built out.
- The local skeleton currently still defaults to SQLite (`DB_CONNECTION=sqlite` in `.env.example`) — this has not yet been switched to Postgres.

## Stack

- PHP 8.2+, Laravel 12
- DB: PostgreSQL (target), schema-per-tenant — see "Database architecture" above. Local `.env.example` still defaults to SQLite pending migration.
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

## Git conventions

- Do not add a `Co-Authored-By: Claude` (or Anthropic) line to commit messages.
