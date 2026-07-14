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
            ['name' => 'Retail Shop', 'slug' => 'retail_shop'],
            ['name' => 'Restaurant', 'slug' => 'restaurant'],
            ['name' => 'Cafe', 'slug' => 'cafe'],
            ['name' => 'Salon / Barber', 'slug' => 'salon_barber'],
            ['name' => 'Gym', 'slug' => 'gym'],
            ['name' => 'Hotel', 'slug' => 'hotel'],
            ['name' => 'Guest House', 'slug' => 'guest_house'],
            ['name' => 'Events', 'slug' => 'events'],
            ['name' => 'Workshops', 'slug' => 'workshops'],
        ];

        foreach ($businessTypes as $businessType) {
            BusinessType::updateOrCreate(['slug' => $businessType['slug']], $businessType);
        }
    }
}
