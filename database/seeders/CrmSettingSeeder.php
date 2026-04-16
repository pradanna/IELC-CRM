<?php

namespace database\seeders;

use App\Models\CrmSetting;
use Illuminate\Database\Seeder;

class CrmSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'hygiene_new_to_cold_days',
                'value' => '7',
                'description' => 'Berapa hari lead New diam sebelum otomatis masuk ke Cold Leads?',
            ],
            [
                'key' => 'hygiene_prospect_to_cold_days',
                'value' => '30',
                'description' => 'Berapa hari lead Prospective diam sebelum otomatis masuk ke Cold Leads?',
            ],
            [
                'key' => 'fup_task_trigger_days',
                'value' => '4',
                'description' => 'Setelah berapa hari lead diam tugas follow-up otomatis muncul di dashboard?',
            ],
            [
                'key' => 'fup_max_attempts',
                'value' => '7',
                'description' => 'Maksimal berapa kali follow-up (FUP) sebelum tugas berhenti muncul di dashboard?',
            ],
        ];

        foreach ($settings as $setting) {
            CrmSetting::set($setting['key'], $setting['value'], $setting['description']);
        }
    }
}
