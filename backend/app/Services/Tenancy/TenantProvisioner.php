<?php

namespace App\Services\Tenancy;

use App\Models\Tenant;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class TenantProvisioner
{
    /**
     * Create the tenant's Postgres schema and run database/migrations/tenant/ against it.
     */
    public function provision(Tenant $tenant): void
    {
        $schema = $this->assertSafeSchemaName($tenant->schema_name);

        DB::statement("CREATE SCHEMA IF NOT EXISTS \"{$schema}\"");

        $this->pointTenantConnectionAt($schema);

        $exitCode = Artisan::call('migrate', [
            '--database' => 'tenant',
            '--path' => 'database/migrations/tenant',
            '--force' => true,
        ]);

        DB::purge('tenant');

        if ($exitCode !== 0) {
            throw new RuntimeException("Tenant migration failed for schema \"{$schema}\": ".Artisan::output());
        }
    }

    /**
     * Drop a tenant's schema and everything in it. Irreversible.
     */
    public function deprovision(Tenant $tenant): void
    {
        $schema = $this->assertSafeSchemaName($tenant->schema_name);

        DB::statement("DROP SCHEMA IF EXISTS \"{$schema}\" CASCADE");
    }

    private function pointTenantConnectionAt(string $schema): void
    {
        Config::set('database.connections.tenant.search_path', "{$schema},public");
        DB::purge('tenant');
    }

    /**
     * Postgres schema names can't be parameter-bound in DDL, so this is the
     * one line standing between a tenant row and a SQL injection — keep it strict.
     */
    private function assertSafeSchemaName(?string $schema): string
    {
        if (! $schema || ! preg_match('/^[a-z_][a-z0-9_]{0,62}$/', $schema)) {
            throw new RuntimeException('Refusing to use unsafe schema name: '.json_encode($schema));
        }

        return $schema;
    }
}
