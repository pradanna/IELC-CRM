<?php

namespace App\Domains\CRM\Application\Listeners;

use App\Domains\Finance\Domain\Events\InvoiceGenerated;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Master\Domain\Models\LeadPhase;

class UpdateLeadPhaseOnInvoiceGenerated
{
    public function handle(InvoiceGenerated $event): void
    {
        // Generating an invoice does not automatically change the lead's phase.
        return;
    }
}
