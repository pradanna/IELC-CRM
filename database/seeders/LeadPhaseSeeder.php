<?php

namespace Database\Seeders;

use App\Models\LeadPhase;
use Illuminate\Database\Seeder;

class LeadPhaseSeeder extends Seeder
{
    public function run(): void
    {
        $phases = [
            ['name' => 'Lead', 'code' => 'lead', 'status' => 'new'],
            ['name' => 'Prospect', 'code' => 'prospect', 'status' => 'prospective'],
            ['name' => 'Consultation', 'code' => 'consultation', 'status' => 'prospective'],
            ['name' => 'Placement Test', 'code' => 'placement-test', 'status' => 'prospective'],
            ['name' => 'Pre-Enrollment', 'code' => 'pre-enrollment', 'status' => 'prospective'],
            ['name' => 'Invoice', 'code' => 'invoice', 'status' => 'prospective'],
            ['name' => 'Enrollment', 'code' => 'enrollment', 'status' => 'closing'],
            ['name' => 'Cold Leads', 'code' => 'cold-leads', 'status' => 'lost'],
            ['name' => 'Dropout Leads', 'code' => 'dropout-leads', 'status' => 'lost'],
        ];

        foreach ($phases as $phase) {
            LeadPhase::updateOrCreate(['code' => $phase['code']], $phase);
        }
    }
}
