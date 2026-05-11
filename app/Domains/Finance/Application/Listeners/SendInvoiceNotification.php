<?php

namespace App\Domains\Finance\Application\Listeners;

use App\Domains\Finance\Domain\Events\InvoiceGenerated;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Shared\Domain\Models\User;
use App\Notifications\SystemNotification;

class SendInvoiceNotification
{
    public function handle(InvoiceGenerated $event): void
    {
        $invoice = $event->invoice;
        $data = $event->data;

        $lead = Lead::find($data['lead_id'] ?? null);
        $student = Student::find($data['student_id'] ?? null);
        $entityName = $lead ? $lead->name : ($student ? $student->lead->name : 'Student');
        
        $notification = new SystemNotification(
            "Invoice Terbit: {$invoice->invoice_number}",
            "Invoice baru senilai Rp " . number_format($invoice->total_amount, 0, ',', '.') . " telah diterbitkan untuk {$entityName}.",
            'invoice',
            $lead ? "/admin/crm/leads?id={$lead->id}" : "/admin/finance"
        );

        if ($lead && $lead->owner) {
            $lead->owner->notify($notification);
        }

        $superadmins = User::role('superadmin')->get();
        foreach ($superadmins as $admin) {
            if ($lead && $lead->owner_id === $admin->id) continue;
            $admin->notify($notification);
        }
    }
}
