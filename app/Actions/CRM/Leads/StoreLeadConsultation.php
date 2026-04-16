<?php

namespace App\Actions\Crm\Leads;

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

            \App\Models\LeadActivity::create([
                'lead_id' => $lead->id,
                'user_id' => auth()->id(),
                'type' => 'consultation',
                'description' => "Consultation: " . ($data['notes'] ?? 'No notes provided'),
                'created_at' => now()
            ]);

            return $consultation;
        });
    }
}

