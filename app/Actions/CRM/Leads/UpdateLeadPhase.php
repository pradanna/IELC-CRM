<?php

namespace App\Actions\CRM\Leads;

use App\Models\Lead;
use Illuminate\Support\Facades\DB;

class UpdateLeadPhase
{
    public function handle(Lead $lead, array $data): Lead
    {
        return DB::transaction(function () use ($lead, $data) {
            $lead->update([
                'lead_phase_id' => $data['lead_phase_id'],
                'last_activity_at' => now(),
            ]);

            return $lead->refresh();
        });
    }
}
