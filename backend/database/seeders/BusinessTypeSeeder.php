<?php

namespace Database\Seeders;

use App\Models\BusinessType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BusinessTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $businessTypes = [
            ['name' => 'Retail Shop', 'slug' => 'retail_shop', 'color' => '#f5a623'],
            ['name' => 'Restaurant', 'slug' => 'restaurant', 'color' => '#e0532c'],
            ['name' => 'Cafe', 'slug' => 'cafe', 'color' => '#8b5e34'],
            ['name' => 'Salon / Barber', 'slug' => 'salon_barber', 'color' => '#d6336c'],
            ['name' => 'Gym', 'slug' => 'gym', 'color' => '#2f9e44'],
            ['name' => 'Hotel', 'slug' => 'hotel', 'color' => '#2b6cb0'],
            ['name' => 'Guest House', 'slug' => 'guest_house', 'color' => '#0891b2'],
            ['name' => 'Events', 'slug' => 'events', 'color' => '#7c3aed'],
            ['name' => 'Workshops', 'slug' => 'workshops', 'color' => '#ca8a04'],
        ];

        foreach ($businessTypes as $businessType) {
            BusinessType::updateOrCreate(['slug' => $businessType['slug']], $businessType);
        }
    }
}
