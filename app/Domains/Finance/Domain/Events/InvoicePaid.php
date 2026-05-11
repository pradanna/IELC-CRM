<?php

namespace App\Domains\Finance\Domain\Events;

use App\Domains\Finance\Domain\Models\Invoice;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InvoicePaid
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Invoice $invoice
    ) {}
}
