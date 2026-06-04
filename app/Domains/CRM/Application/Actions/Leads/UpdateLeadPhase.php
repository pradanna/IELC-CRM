<?php

namespace App\Domains\CRM\Application\Actions\Leads;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Master\Domain\Models\LeadPhase;
use Illuminate\Support\Facades\DB;

class UpdateLeadPhase
{
    public function handle(Lead $lead, array $data): Lead
    {
        return DB::transaction(function () use ($lead, $data) {
            $phase = LeadPhase::find($data['lead_phase_id']);
            $updateData = [
                'lead_phase_id' => $data['lead_phase_id'],
                'last_activity_at' => now(),
            ];

            if ($phase) {
                $prospectiveCodes = ['prospect', 'consultation', 'placement-test', 'pre-enrollment', 'invoice', 'enrollment'];
                $lostCodes = ['cold-leads', 'dropout-leads'];

                // 1. Reached Prospective Milestone
                if (in_array($phase->code, $prospectiveCodes) && is_null($lead->reached_prospective_at)) {
                    $updateData['reached_prospective_at'] = now();
                }

                // 2. First Consultation Milestone (If moved manually to Consultation phase)
                if ($phase->code === 'consultation' && is_null($lead->first_consultation_at)) {
                    $updateData['first_consultation_at'] = now();
                }

                // 3. First PT Milestone (If moved manually to PT phase)
                if ($phase->code === 'placement-test' && is_null($lead->first_pt_at)) {
                    $updateData['first_pt_at'] = now();
                }

                // 4. Enrolled Milestone
                if ($phase->code === 'enrollment' && is_null($lead->enrolled_at)) {
                    $updateData['enrolled_at'] = now();
                }

                // 5. Lost Milestone
                if (in_array($phase->code, $lostCodes) && is_null($lead->lost_at)) {
                    $updateData['lost_at'] = now();
                }
            }

            $lead->update($updateData);

            return $lead->refresh();
        });
    }
}



