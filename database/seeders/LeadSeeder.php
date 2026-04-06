<?php

namespace Database\Seeders;

use App\Models\Lead;
use App\Models\LeadSource;
use App\Models\LeadType;
use App\Models\LeadPhase;
use App\Models\Branch;
use App\Models\User;
use App\Models\Province;
use App\Models\City;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LeadSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::all();
        $sources = LeadSource::all();
        $types = LeadType::all();
        $phases = LeadPhase::all();
        $owner = User::role('superadmin')->first() ?? User::first();
        $provinces = Province::all();

        $maleNames = ['Budi', 'Agus', 'Hendra', 'Andi', 'Sutrisno', 'Bambang', 'Dedi', 'Eko', 'Rinto', 'Joko'];
        $femaleNames = ['Siti', 'Ratna', 'Ani', 'Dewi', 'Endang', 'Sri', 'Lina', 'Maya', 'Rika', 'Wati'];
        $lastNames = ['Santoso', 'Prabowo', 'Saputra', 'Kusuma', 'Gunawan', 'Wijaya', 'Sutanto', 'Hidayat', 'Purnomo'];

        for ($i = 1; $i <= 100; $i++) {
            $isMale = rand(0, 1);
            $firstName = $isMale ? $maleNames[array_rand($maleNames)] : $femaleNames[array_rand($femaleNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $fullName = "$firstName $lastName";
            
            $province = $provinces->random();
            $city = City::where('province_id', $province->id)->inRandomOrder()->first();

            Lead::create([
                'id' => Str::uuid(),
                'lead_number' => 'L' . str_pad($i, 5, '0', STR_PAD_LEFT),
                'name' => $fullName,
                'phone' => '08' . rand(11, 19) . rand(1000000, 9999999),
                'email' => strtolower($firstName) . '.' . strtolower($lastName) . rand(1, 99) . '@example.com',
                'branch_id' => $branches->random()->id,
                'owner_id' => $owner->id,
                'lead_source_id' => $sources->random()->id,
                'lead_type_id' => $types->random()->id,
                'lead_phase_id' => $phases->random()->id,
                'province' => $province->name,
                'city' => $city?->name ?? 'Unknown',
                'is_online' => (bool)rand(0, 1),
                'created_at' => now()->subDays(rand(0, 30)),
            ]);
        }
    }
}
