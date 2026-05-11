<?php

namespace App\Domains\CRM\Application\Listeners;

use App\Domains\Finance\Domain\Events\InvoiceGenerated;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Master\Domain\Models\LeadPhase;

class UpdateLeadPhaseOnInvoiceGenerated
{
    public function handle(InvoiceGenerated $event): void
    {
        $data = $event->data;
        
        if (isset($data['lead_id'])) {
            $lead = Lead::find($data['lead_id']);
            if ($lead) {
                $invoicePhase = LeadPhase::where('code', 'invoice')->first();
                $lead->update(['lead_phase_id' => $invoicePhase?->id]);
            }
        }
    }
}
