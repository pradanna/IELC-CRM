<?php

namespace App\Domains\Finance\Application\Actions;

use App\Domains\Finance\Domain\Events\InvoicePaid;
use App\Domains\Finance\Domain\Models\Invoice;
use Illuminate\Support\Facades\DB;

class ProcessInvoicePayment
{
    /**
     * Process an invoice payment, promoting the lead to student if necessary.
     */
    public function handle(Invoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $invoice->update(['status' => 'paid']);

            // Update student status if applicable
            if ($invoice->student_id) {
                $invoice->student->update(['status' => 'active']);
            }

            // Dispatch Event (Decoupled concerns)
            InvoicePaid::dispatch($invoice);
        });
    }
}


