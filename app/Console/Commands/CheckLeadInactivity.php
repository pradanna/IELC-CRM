<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\LeadPhase;
use App\Models\Task;
use Illuminate\Console\Command;
use Carbon\Carbon;

class CheckLeadInactivity extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-lead-inactivity';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create follow-up tasks for leads with 4 and 7 days of inactivity';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for inactive leads...');

        $fourDaysAgo = Carbon::now()->subDays(4)->toDateString();
        $sevenDaysAgo = Carbon::now()->subDays(7)->toDateString();

        // 1. Ambil fase yang dikecualikan (Enrollment & Cold Leads)
        $excludedPhaseIds = LeadPhase::whereIn('code', ['enrollment', 'cold-leads'])->pluck('id');

        // 2. Cari lead yang tidak aktif selama 4 hari
        $leads4 = Lead::whereIn('lead_phase_id', LeadPhase::whereNotIn('id', $excludedPhaseIds)->pluck('id'))
            ->whereDate('last_activity_at', $fourDaysAgo)
            ->get();

        foreach ($leads4 as $lead) {
            $this->createTask($lead, 4);
        }

        // 3. Cari lead yang tidak aktif selama 7 hari
        $leads7 = Lead::whereIn('lead_phase_id', LeadPhase::whereNotIn('id', $excludedPhaseIds)->pluck('id'))
             ->whereDate('last_activity_at', $sevenDaysAgo)
             ->get();

        foreach ($leads7 as $lead) {
            $this->createTask($lead, 7);
        }

        $this->info('Inactivity check completed.');
    }

    private function createTask(Lead $lead, int $days)
    {
        $title = "Follow-up Reminder: {$days} Days Inactive";
        
        // Cek apakah task serupa sudah ada (untuk menghindari duplikasi jika command dijalankan berkali-kali)
        $exists = Task::where('lead_id', $lead->id)
            ->where('title', $title)
            ->where('is_completed', false)
            ->exists();

        if (!$exists) {
            Task::create([
                'lead_id' => $lead->id,
                'assigned_to' => $lead->owner_id ?: $lead->created_by,
                'title' => $title,
                'description' => "Lead {$lead->name} tidak memiliki aktivitas selama {$days} hari terakhir. Mohon segera di-follow up.",
                'priority' => $days >= 7 ? 'high' : 'medium',
                'is_completed' => false,
                'due_date' => now(),
            ]);

            $this->info("Task created for Lead: {$lead->name} ({$days} days)");
        }
    }
}
