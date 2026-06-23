<?php

namespace Database\Seeders;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Master\Domain\Models\LeadSource;
use App\Domains\Master\Domain\Models\InfoSource;
use App\Domains\Master\Domain\Models\LeadType;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Master\Domain\Models\Province;
use App\Domains\Master\Domain\Models\City;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LeadSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::all();
        $sources = LeadSource::all();
        $infoSources = InfoSource::all();
        $types = LeadType::all();
        $phases = LeadPhase::all();
        $owner = User::role('superadmin')->first() ?? User::first();
        $provinces = Province::all();

        $province = $provinces->where('name', 'Jawa Tengah')->first() ?? $provinces->first();
        $city = City::where('province_id', $province->id)->first();

        // Membuat 1 Lead Contoh untuk testing real
        Lead::create([
            'id' => Str::uuid(),
            'lead_number' => 'L00001',
            'name' => 'Siswa Contoh (Test Real)',
            'phone' => '081234567890', // Silakan ubah ke nomor WhatsApp Anda untuk tes real
            'email' => 'siswa.contoh@example.com',
            'branch_id' => $branches->where('code', 'SOLO')->first()?->id ?? $branches->first()->id,
            'owner_id' => $owner->id,
            'lead_source_id' => $sources->first()->id,
            'info_source_id' => $infoSources->isEmpty() ? null : $infoSources->first()->id,
            'lead_type_id' => $types->first()->id,
            'lead_phase_id' => $phases->where('code', 'lead')->first()?->id ?? $phases->first()->id,
            'province' => $province->name,
            'city' => $city?->name ?? 'Surakarta',
            'is_online' => true,
            'follow_up_count' => 0,
            'reached_prospective_at' => null,
            'enrolled_at' => null,
            'lost_at' => null,
            'created_at' => now(),
        ]);
    }
}
