<?php

namespace App\Domains\CRM\Application\Listeners;

use App\Domains\Finance\Domain\Events\InvoicePaid;
use App\Domains\CRM\Domain\Models\LeadEnrollment;

class CreateLeadEnrollmentOnInvoicePaid
{
    public function handle(InvoicePaid $event): void
    {
        $invoice = $event->invoice->refresh();

        // Only create lead_enrollments for target-counting invoice types: new_join & rejoin
        // (Skip placement_test and paket_lanjut)
        if (in_array($invoice->type, ['placement_test', 'paket_lanjut']) || !$invoice->study_class_id || !$invoice->lead_id) {
            return;
        }

        // Determine the joined_at date: use invoice start_date (actual class join date)
        $joinedAt = $invoice->start_date ?? now()->toDateString();
        $endDate = $invoice->studyClass?->end_session_date ? $invoice->studyClass->end_session_date->format('Y-m-d') : null;

        // Update existing pending_payment enrollment or create a new active enrollment
        LeadEnrollment::updateOrCreate(
            [
                'invoice_id' => $invoice->id,
            ],
            [
                'lead_id'        => $invoice->lead_id,
                'student_id'     => $invoice->student_id,
                'study_class_id' => $invoice->study_class_id,
                'joined_at'      => $joinedAt,
                'end_date'       => $endDate,
                'status'         => 'active',
                'cycle_number'   => $invoice->studyClass?->current_session_number ?? 1,
            ]
        );

        // Update leads.enrolled_at with the first enrollment date (backward compat)
        $lead = $invoice->lead;
        if ($lead && !$lead->enrolled_at) {
            $lead->updateQuietly(['enrolled_at' => $joinedAt]);
        }

        // Invalidate CRM dashboard cache so line chart & stats update immediately
        \Illuminate\Support\Facades\Cache::increment('crm_dashboard_version');
    }
}
