<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\LeadPhase;
use App\Models\CrmSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CrmCleanupInactiveLeads extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'crm:cleanup-inactive-leads';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Move inactive New and Prospective leads to Cold Leads based on dynamic settings';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting CRM hygiene cleanup...');

        // 1. Fetch Dynamic Settings
        $newToColdDays = (int) CrmSetting::get('hygiene_new_to_cold_days', 7);
        $prospectToColdDays = (int) CrmSetting::get('hygiene_prospect_to_cold_days', 30);

        $coldPhase = LeadPhase::where('code', 'cold-leads')->first();
        if (!$coldPhase) {
            $this->error('Phase [cold-leads] not found in the database. Aborting.');
            return;
        }

        // 2. Process NEW Leads
        $newLeads = Lead::whereHas('leadPhase', fn($q) => $q->where('code', 'lead'))
            ->where(function($q) use ($newToColdDays) {
                $q->where('last_activity_at', '<=', now()->subDays($newToColdDays))
                  ->orWhere(function($subq) use ($newToColdDays) {
                      $subq->whereNull('last_activity_at')
                           ->where('created_at', '<=', now()->subDays($newToColdDays));
                  });
            })
            ->get();

        foreach ($newLeads as $lead) {
            $lead->update(['lead_phase_id' => $coldPhase->id]);
            activity()
                ->performedOn($lead)
                ->log("Otomatis dipindah ke Cold Leads setelah {$newToColdDays} hari tidak aktif (Dari tahap New).");
        }

        // 3. Process PROSPECTIVE Leads
        $prospectPhases = ['prospect', 'consultation', 'placement-test', 'pre-enrollment', 'invoice'];
        $prospectiveLeads = Lead::whereHas('leadPhase', fn($q) => $q->whereIn('code', $prospectPhases))
            ->where('last_activity_at', '<=', now()->subDays($prospectToColdDays))
            ->get();

        foreach ($prospectiveLeads as $lead) {
            $lead->update(['lead_phase_id' => $coldPhase->id]);
            activity()
                ->performedOn($lead)
                ->log("Otomatis dipindah ke Cold Leads setelah {$prospectToColdDays} hari tidak aktif (Dari tahap Prospek).");
        }

        $total = $newLeads->count() + $prospectiveLeads->count();
        $this->info("Hygiene cleanup finished. {$total} leads moved to Cold Leads.");
        
        Log::info("CRM Hygiene Task: Moved {$total} leads to Cold Leads (Settings: New:{$newToColdDays}d, Prosp:{$prospectToColdDays}d).");
    }
}
