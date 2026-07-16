<?php

namespace Database\Seeders;

use App\Enums\CatalogStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\ServiceAvailabilityType;
use App\Enums\TenantStaffRole;
use App\Models\Booking;
use App\Models\BusinessType;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceTimeSlot;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Tenancy\TenantProvisioner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    /**
     * Reproducible demo dataset for reviewers: one admin, four provisioned
     * tenants across different business models (each with its own
     * owner/staff, catalog, photos, and schedule), and one customer with
     * activity spanning two of them. Every account below uses the password
     * "password" -- see the README's Demo Credentials section, which
     * documents these exact accounts.
     *
     * Product/service/cover photos are Lorem Picsum URLs (a public
     * placeholder-image service), stored directly as `url` with a
     * clearly-fake `public_id` -- these aren't real Cloudinary uploads, just
     * enough to make the seeded catalog look real without needing actual
     * image files at seed time.
     */
    public function run(TenantProvisioner $provisioner): void
    {
        $customerRole = Role::where('slug', 'customer')->firstOrFail();

        $this->seedAdmin();
        $customer = $this->seedCustomer($customerRole);

        $tenants = [];
        foreach ($this->businessDefinitions() as $definition) {
            $tenants[$definition['slug']] = $this->seedBusiness($definition, $customerRole, $provisioner);
        }

        $this->seedSampleActivity($customer, $tenants['the-daily-grind'], $tenants['cutting-edge-studio']);
    }

    private function seedAdmin(): User
    {
        $adminRole = Role::where('slug', 'admin')->firstOrFail();

        return User::updateOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin User', 'password' => Hash::make('password'), 'role_id' => $adminRole->id]
        );
    }

    private function seedCustomer(Role $customerRole): User
    {
        return User::updateOrCreate(
            ['email' => 'customer@example.com'],
            ['name' => 'Casey Customer', 'password' => Hash::make('password'), 'role_id' => $customerRole->id]
        );
    }

    /**
     * @return array{
     *   slug: string, name: string, type: string, intro: string,
     *   owner: array{email: string, name: string},
     *   staff: array{email: string, name: string},
     *   products: array<int, array<string, mixed>>,
     *   services: array<int, array<string, mixed>>,
     * }[]
     */
    private function businessDefinitions(): array
    {
        return [
            [
                'slug' => 'the-daily-grind',
                'name' => 'The Daily Grind',
                'type' => 'cafe',
                'intro' => 'Neighborhood coffee bar serving single-origin espresso, cold brew, and weekend barista classes.',
                'owner' => ['email' => 'owner@example.com', 'name' => 'Olivia Owner'],
                'staff' => ['email' => 'staff@example.com', 'name' => 'Sam Staff'],
                'products' => [
                    ['name' => 'House Blend Coffee (250g)', 'price' => 4.50, 'sku' => 'COFFEE-HOUSE', 'stock_quantity' => 50],
                    ['name' => 'Cold Brew Concentrate', 'price' => 5.00, 'sku' => 'COFFEE-COLDBREW', 'stock_quantity' => 30],
                    ['name' => 'Blueberry Muffin', 'price' => 3.25, 'sku' => 'BAKE-MUFFIN-BLUE', 'stock_quantity' => 20],
                    ['name' => 'Ceramic Mug', 'price' => 12.00, 'sku' => 'MERCH-MUG', 'stock_quantity' => 15],
                ],
                'services' => [
                    [
                        'name' => 'Barista Class', 'price' => 45.00, 'capacity' => 6,
                        'duration_value' => 2, 'duration_unit' => 'hours',
                        'advance_booking_value' => 1, 'advance_booking_unit' => 'days',
                        'time_slots' => [['days' => [1, 2, 3, 4, 5], 'start' => '10:00', 'end' => '16:00']],
                    ],
                    [
                        'name' => 'Private Tasting Session', 'price' => 30.00, 'capacity' => 2,
                        'duration_value' => 1, 'duration_unit' => 'hours',
                        'advance_booking_value' => 2, 'advance_booking_unit' => 'hours',
                        'time_slots' => [['days' => [2, 4], 'start' => '14:00', 'end' => '17:00']],
                    ],
                ],
            ],
            [
                'slug' => 'northside-supply-co',
                'name' => 'Northside Supply Co.',
                'type' => 'retail_shop',
                'intro' => 'Everyday goods and outdoor gear, with personal shopping appointments for gift help.',
                'owner' => ['email' => 'retail-owner@example.com', 'name' => 'Rita Retailer'],
                'staff' => ['email' => 'retail-staff@example.com', 'name' => 'Ray Stockroom'],
                'products' => [
                    ['name' => 'Canvas Backpack', 'price' => 58.00, 'sku' => 'BAG-CANVAS-01', 'stock_quantity' => 25],
                    ['name' => 'Insulated Water Bottle', 'price' => 22.00, 'sku' => 'BTL-INS-01', 'stock_quantity' => 40],
                    ['name' => 'Notebook 3-Pack', 'price' => 14.00, 'sku' => 'STA-NB-3PK', 'stock_quantity' => 60],
                    ['name' => 'Desk Lamp', 'price' => 34.50, 'sku' => 'LMP-DESK-01', 'stock_quantity' => 18],
                ],
                'services' => [
                    [
                        'name' => 'Personal Shopping Appointment', 'price' => 0, 'capacity' => 3,
                        'duration_value' => 30, 'duration_unit' => 'minutes',
                        'advance_booking_value' => 3, 'advance_booking_unit' => 'hours',
                        'time_slots' => [['days' => [1, 3, 5], 'start' => '11:00', 'end' => '15:00']],
                    ],
                ],
            ],
            [
                'slug' => 'cutting-edge-studio',
                'name' => 'Cutting Edge Studio',
                'type' => 'salon_barber',
                'intro' => 'Modern cuts, beard grooming, and retail hair care in the heart of downtown.',
                'owner' => ['email' => 'salon-owner@example.com', 'name' => 'Sofia Stylist'],
                'staff' => ['email' => 'salon-staff@example.com', 'name' => 'Beau Barber'],
                'products' => [
                    ['name' => 'Matte Styling Clay', 'price' => 18.00, 'sku' => 'HAIR-CLAY-01', 'stock_quantity' => 22],
                    ['name' => 'Sulfate-Free Shampoo', 'price' => 16.50, 'sku' => 'HAIR-SHMP-01', 'stock_quantity' => 30],
                ],
                'services' => [
                    [
                        'name' => 'Signature Haircut', 'price' => 40.00, 'capacity' => 1,
                        'duration_value' => 45, 'duration_unit' => 'minutes',
                        'advance_booking_value' => 4, 'advance_booking_unit' => 'hours',
                        'time_slots' => [['days' => [2, 3, 4, 5, 6], 'start' => '09:00', 'end' => '17:00']],
                    ],
                    [
                        'name' => 'Beard Trim', 'price' => 20.00, 'capacity' => 1,
                        'duration_value' => 20, 'duration_unit' => 'minutes',
                        'advance_booking_value' => 2, 'advance_booking_unit' => 'hours',
                        'time_slots' => [['days' => [2, 3, 4, 5, 6], 'start' => '09:00', 'end' => '17:00']],
                    ],
                ],
            ],
            [
                'slug' => 'iron-peak-fitness',
                'name' => 'Iron Peak Fitness',
                'type' => 'gym',
                'intro' => 'Strength training gym with group HIIT classes and one-on-one coaching.',
                'owner' => ['email' => 'gym-owner@example.com', 'name' => 'Gina Gains'],
                'staff' => ['email' => 'gym-staff@example.com', 'name' => 'Cole Coach'],
                'products' => [
                    ['name' => 'Shaker Bottle', 'price' => 9.00, 'sku' => 'GYM-SHAKE-01', 'stock_quantity' => 45],
                    ['name' => 'Gym Towel', 'price' => 11.00, 'sku' => 'GYM-TOWEL-01', 'stock_quantity' => 35],
                    ['name' => 'Monthly Guest Pass', 'price' => 25.00, 'sku' => 'GYM-PASS-01', 'stock_quantity' => null],
                ],
                'services' => [
                    [
                        'name' => 'HIIT Class', 'price' => 15.00, 'capacity' => 12,
                        'duration_value' => 45, 'duration_unit' => 'minutes',
                        'advance_booking_value' => 1, 'advance_booking_unit' => 'hours',
                        'time_slots' => [['days' => [1, 3, 5], 'start' => '18:00', 'end' => '19:00']],
                    ],
                    [
                        'name' => 'Personal Training Session', 'price' => 50.00, 'capacity' => 1,
                        'duration_value' => 1, 'duration_unit' => 'hours',
                        'advance_booking_value' => 1, 'advance_booking_unit' => 'days',
                        'time_slots' => [['days' => [1, 2, 3, 4, 5], 'start' => '07:00', 'end' => '10:00']],
                    ],
                ],
            ],
        ];
    }

    private function seedBusiness(array $definition, Role $customerRole, TenantProvisioner $provisioner): Tenant
    {
        $owner = User::updateOrCreate(
            ['email' => $definition['owner']['email']],
            ['name' => $definition['owner']['name'], 'password' => Hash::make('password'), 'role_id' => $customerRole->id]
        );

        $staffUser = User::updateOrCreate(
            ['email' => $definition['staff']['email']],
            ['name' => $definition['staff']['name'], 'password' => Hash::make('password'), 'role_id' => $customerRole->id]
        );

        $businessType = BusinessType::where('slug', $definition['type'])->firstOrFail();

        $tenant = Tenant::firstOrNew(['slug' => $definition['slug']]);
        $isNewTenant = ! $tenant->exists;

        $tenant->fill([
            'name' => $definition['name'],
            'business_type_id' => $businessType->id,
            'schema_name' => 'tenant_'.str_replace('-', '_', $definition['slug']),
            'owner_user_id' => $owner->id,
            'status' => 'active',
            'intro_text' => $definition['intro'],
            'cover_image_url' => "https://picsum.photos/seed/{$definition['slug']}-cover/1200/400",
        ])->save();

        if ($isNewTenant) {
            $provisioner->provision($tenant);
        }

        $staffMember = $tenant->staff()->updateOrCreate(
            ['user_id' => $staffUser->id],
            ['role' => TenantStaffRole::Staff, 'status' => 'active']
        );

        $this->pointAtTenant($tenant);

        foreach ($definition['products'] as $i => $product) {
            $created = Product::updateOrCreate(
                ['slug' => Str::slug($product['name'])],
                $product + ['description' => 'Demo product seeded for review.', 'status' => CatalogStatus::Active]
            );
            $created->images()->updateOrCreate(['position' => 0], [
                'url' => "https://picsum.photos/seed/{$definition['slug']}-product-{$i}/600/600",
                'public_id' => "seed/{$definition['slug']}-product-{$i}",
            ]);
        }

        foreach ($definition['services'] as $i => $service) {
            $timeSlots = $service['time_slots'] ?? [];
            unset($service['time_slots']);

            $created = Service::updateOrCreate(
                ['slug' => Str::slug($service['name'])],
                $service + ['description' => 'Demo service seeded for review.', 'status' => CatalogStatus::Active]
            );
            $created->images()->updateOrCreate(['position' => 0], [
                'url' => "https://picsum.photos/seed/{$definition['slug']}-service-{$i}/600/600",
                'public_id' => "seed/{$definition['slug']}-service-{$i}",
            ]);

            foreach ($timeSlots as $rule) {
                foreach ($rule['days'] as $weekday) {
                    $slot = ServiceTimeSlot::updateOrCreate([
                        'service_id' => $created->id,
                        'availability_type' => ServiceAvailabilityType::Standing,
                        'day_of_week' => $weekday,
                    ], [
                        'start_time' => $rule['start'],
                        'end_time' => $rule['end'],
                    ]);
                    $slot->staff()->sync([$staffMember->id]);
                }
            }
        }

        DB::purge('tenant');

        return $tenant;
    }

    /**
     * A sample order at one tenant and a sample booking at another, so the
     * demo customer's cross-tenant "My Orders & Bookings" view has real
     * activity spanning more than one business immediately after seeding.
     */
    private function seedSampleActivity(User $customer, Tenant $cafeTenant, Tenant $salonTenant): void
    {
        $this->pointAtTenant($cafeTenant);

        $product = Product::first();
        $order = Order::firstOrCreate(
            ['user_id' => $customer->id, 'placed_at' => now()->subDay()],
            ['status' => 'confirmed', 'total_amount' => $product->price, 'currency' => 'USD']
        );
        $order->items()->firstOrCreate(['product_id' => $product->id], [
            'quantity' => 1,
            'unit_price' => $product->price,
        ]);
        $order->payments()->firstOrCreate([], [
            'amount' => $order->total_amount,
            'currency' => 'USD',
            'method' => PaymentMethod::PayAtShop,
            'status' => PaymentStatus::Paid,
        ]);

        $this->pointAtTenant($salonTenant);

        $service = Service::first();
        $bookingStart = now()->addDays(2)->setTime(11, 0);
        $booking = Booking::firstOrCreate(
            ['user_id' => $customer->id, 'service_id' => $service->id, 'starts_at' => $bookingStart],
            ['ends_at' => $bookingStart->clone()->addMinutes($service->duration_value ?? 45), 'status' => 'confirmed']
        );
        $booking->payments()->firstOrCreate([], [
            'amount' => $service->price,
            'currency' => 'USD',
            'method' => PaymentMethod::PayAtShop,
            'status' => PaymentStatus::Unpaid,
        ]);

        DB::purge('tenant');
    }

    private function pointAtTenant(Tenant $tenant): void
    {
        Config::set('database.connections.tenant.search_path', "{$tenant->schema_name},public");
        DB::purge('tenant');
    }
}
