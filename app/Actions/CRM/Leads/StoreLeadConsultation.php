<?php

namespace App\Actions\CRM\Leads;

use App\Models\Lead;
use App\Models\LeadConsultation;
use Illuminate\Support\Facades\DB;

class StoreLeadConsultation
{
    public function handle(Lead $lead, array $data): LeadConsultation
    {
        return DB::transaction(function () use ($lead, $data) {
            $consultation = $lead->consultations()->create([
                'user_id'           => auth()->id(),
                'consultation_date' => $data['consultation_date'],
                'notes'             => $data['notes'] ?? null,
                'recommended_level' => $data['recommended_level'] ?? null,
                'follow_up_note'    => $data['follow_up_note'] ?? null,
            ]);

            activity()
                ->performedOn($lead)
                ->causedBy(auth()->user())
                ->log("Consultation recorded. Recommended Level: " . ($data['recommended_level'] ?? 'None'));

            return $consultation;
        });
    }
}
