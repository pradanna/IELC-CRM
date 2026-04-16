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

        $enrollmentPhase = $phases->where('code', 'enrollment')->first();
        $lostPhases = $phases->whereIn('code', ['cold-leads', 'dropout-leads']);
        $prospectivePhases = $phases->whereIn('status', ['prospective']);

        for ($i = 1; $i <= 100; $i++) {
            $isMale = rand(0, 1);
            $firstName = $isMale ? $maleNames[array_rand($maleNames)] : $femaleNames[array_rand($femaleNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $fullName = "$firstName $lastName";
            
            $province = $provinces->random();
            $city = City::where('province_id', $province->id)->inRandomOrder()->first();

            // More intentional distribution:
            // 20% New, 40% Prospective, 15% Enrolled, 25% Lost
            $roll = rand(1, 100);
            if ($roll <= 20) {
                $phase = $phases->where('code', 'lead')->first();
            } elseif ($roll <= 60) {
                $phase = $prospectivePhases->random();
            } elseif ($roll <= 75) {
                $phase = $enrollmentPhase;
            } else {
                $phase = $lostPhases->random();
            }

            $createdAt = now()->subDays(rand(0, 60)); // Up to 2 months ago
            
            // Calculate timestamps based on phase status
            $reachedProspectiveAt = null;
            $enrolledAt = null;
            $lostAt = null;

            if ($phase->status === 'prospective' || $phase->status === 'closing') {
                $reachedProspectiveAt = $createdAt->copy()->addDays(rand(1, 5));
            }

            if ($phase->status === 'closing') {
                $enrolledAt = ($reachedProspectiveAt ?? $createdAt)->copy()->addDays(rand(2, 10));
            }

            if ($phase->status === 'lost') {
                $lostAt = $createdAt->copy()->addDays(rand(3, 14));
            }

            // Create the lead with pre-calculated timestamps
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
                'lead_phase_id' => $phase->id,
                'province' => $province->name,
                'city' => $city?->name ?? 'Unknown',
                'is_online' => (bool)rand(0, 1),
                'follow_up_count' => $phase->status !== 'new' ? rand(1, 10) : 0,
                'reached_prospective_at' => $reachedProspectiveAt,
                'enrolled_at' => $enrolledAt,
                'lost_at' => $lostAt,
                'created_at' => $createdAt,
            ]);
        }
    }
}
