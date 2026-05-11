<?php

namespace App\Domains\CRM\Application\Actions\Leads;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadConsultation;
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

            \App\Domains\CRM\Domain\Models\LeadActivity::create([
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



