<?php

namespace App\Domains\Finance\Application\Listeners;

use App\Domains\Finance\Domain\Events\InvoicePaid;
use App\Domains\Shared\Domain\Models\User;
use App\Notifications\SystemNotification;

class SendInvoicePaidNotification
{
    public function handle(InvoicePaid $event): void
    {
        $invoice = $event->invoice;
        
        $entityName = $invoice->lead ? $invoice->lead->name : ($invoice->student ? $invoice->student->lead->name : 'Student');
        
        $notification = new SystemNotification(
            "Pembayaran Berhasil: {$invoice->invoice_number}",
            "Pembayaran untuk {$entityName} telah diterima. Siswa kini berstatus Aktif.",
            'success',
            $invoice->lead_id ? route('admin.crm.leads.kanban', ['open_lead' => $invoice->lead_id]) : "/admin/finance"
        );

        // Notify Lead Owner
        if ($invoice->lead && $invoice->lead->owner) {
            $invoice->lead->owner->notify($notification);
        }

        // Notify Superadmins
        $superadmins = User::role('superadmin')->get();
        foreach ($superadmins as $admin) {
            if ($invoice->lead && $invoice->lead->owner_id === $admin->id) continue;
            $admin->notify($notification);
        }
    }
}
