<?php

namespace App\Domains\CRM\Application\Actions\Leads;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use Illuminate\Support\Facades\DB;

class AddLeadEnrollment
{
    /**
     * Add a new class enrollment request from CS for a lead/student with status 'pending_invoice'.
     * Invoice will be generated later by Finance.
     */
    public function handle(Lead $lead, array $data): LeadEnrollment
    {
        return DB::transaction(function () use ($lead, $data) {
            $studyClass = \App\Domains\Academic\Domain\Models\StudyClass::find($data['study_class_id']);
            $endDate = $studyClass?->end_session_date?->toDateString();
            $cycleNumber = $studyClass?->current_session_number ?? 1;

            // Create LeadEnrollment request with status 'pending_invoice'
            $enrollment = LeadEnrollment::create([
                'lead_id'        => $lead->id,
                'student_id'     => $lead->student?->id,
                'study_class_id' => $data['study_class_id'],
                'invoice_id'     => null, // Will be linked when Finance generates invoice
                'joined_at'      => $data['join_date'] ?? now()->toDateString(),
                'end_date'       => $endDate,
                'status'         => 'pending_invoice',
                'cycle_number'   => $cycleNumber,
                'notes'          => $data['notes'] ?? null,
            ]);

            return $enrollment;
        });
    }
}
