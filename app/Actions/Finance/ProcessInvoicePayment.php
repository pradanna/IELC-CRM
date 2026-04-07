<?php

namespace App\Actions\Finance;

use App\Actions\Academic\EnrollStudent;
use App\Actions\Academic\PromoteLeadToStudent;
use App\Models\Invoice;
use App\Models\Lead;
use Illuminate\Support\Facades\DB;

class ProcessInvoicePayment
{
    public function __construct(
        protected PromoteLeadToStudent $promoteLeadToStudent,
        protected EnrollStudent $enrollStudent
    ) {}

    /**
     * Process an invoice payment, promoting the lead to student if necessary.
     */
    public function handle(Invoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $invoice->update(['status' => 'paid']);

            // If it's a lead, promote to student
            if ($invoice->lead_id && !$invoice->student_id) {
                $lead = Lead::findOrFail($invoice->lead_id);
                $student = $this->promoteLeadToStudent->handle($lead);
                
                // Update invoice with new student_id
                $invoice->update(['student_id' => $student->id]);
            }

            // Enroll in the class cycle
            $studentId = $invoice->student_id;
            if ($studentId && $invoice->study_class_id) {
                $this->enrollStudent->handle($invoice->studyClass, $studentId);
            }
        });
    }
}
