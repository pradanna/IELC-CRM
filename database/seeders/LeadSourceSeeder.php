<?php

namespace Database\Seeders;

use App\Models\LeadSource;
use Illuminate\Database\Seeder;

class LeadSourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sources = [
            'Website',
            'Instagram',
            'Facebook',
            'TikTok',
            'Referral',
            'Walk-in',
            'External Event',
            'WhatsApp',
            'Google Ads',
        ];

        foreach ($sources as $source) {
            LeadSource::updateOrCreate(
                ['name' => $source],
                ['code' => \Illuminate\Support\Str::slug($source)]
            );
        }
    }
}
