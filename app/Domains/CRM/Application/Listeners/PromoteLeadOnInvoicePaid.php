<?php

namespace App\Domains\CRM\Application\Listeners;

use App\Domains\Finance\Domain\Events\InvoicePaid;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Academic\Application\Actions\PromoteLeadToStudent;

class PromoteLeadOnInvoicePaid
{
    public function __construct(
        protected PromoteLeadToStudent $promoteLeadToStudent
    ) {}

    public function handle(InvoicePaid $event): void
    {
        $invoice = $event->invoice;

        // Only promote lead to student if invoice is for class enrollment (not placement_test)
        if ($invoice->type !== 'placement_test' && $invoice->study_class_id && $invoice->lead_id && !$invoice->student_id) {
            $lead = Lead::findOrFail($invoice->lead_id);
            $student = $this->promoteLeadToStudent->handle($lead);
            
            // Update invoice with new student_id
            $invoice->update(['student_id' => $student->id]);
        }
    }
}
