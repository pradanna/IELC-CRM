<?php

namespace Database\Seeders;

use App\Domains\Master\Domain\Models\InfoSource;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InfoSourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sources = [
            'Instagram',
            'TikTok',
            'Facebook',
            'WhatsApp',
            'Google Search',
            'Teman / Keluarga',
            'Brosur',
            'Event / Pameran',
            'Lainnya',
        ];

        foreach ($sources as $source) {
            InfoSource::updateOrCreate(
                ['name' => $source],
                ['code' => Str::slug($source)]
            );
        }
    }
}
