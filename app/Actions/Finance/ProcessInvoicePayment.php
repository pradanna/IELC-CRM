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
            } else if ($invoice->student_id) {
                // For rejoin students, ensure their status is set to active
                $invoice->student->update(['status' => 'active']);
            }

            // Enroll in the class cycle
            $studentId = $invoice->student_id;
            if ($studentId && $invoice->study_class_id) {
                $this->enrollStudent->handle($invoice->studyClass, $studentId);
            }

            // Send Notifications
            $entityName = $invoice->lead ? $invoice->lead->name : ($invoice->student ? $invoice->student->lead->name : 'Student');
            $notification = new \App\Notifications\SystemNotification(
                "Pembayaran Berhasil: {$invoice->invoice_number}",
                "Pembayaran untuk {$entityName} telah diterima. Siswa kini berstatus Aktif.",
                'success',
                $invoice->lead_id ? "/admin/crm/leads?id={$invoice->lead_id}" : "/admin/finance"
            );

            // Notify Lead Owner
            if ($invoice->lead && $invoice->lead->owner) {
                $invoice->lead->owner->notify($notification);
            }

            // Notify Superadmins
            $superadmins = \App\Models\User::role('superadmin')->get();
            foreach ($superadmins as $admin) {
                if ($invoice->lead && $invoice->lead->owner_id === $admin->id) continue;
                $admin->notify($notification);
            }
        });
    }
}
