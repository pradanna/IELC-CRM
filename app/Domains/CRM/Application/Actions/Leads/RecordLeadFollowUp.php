<?php

namespace App\Domains\CRM\Application\Actions\Leads;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Master\Domain\Models\LeadPhase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RecordLeadFollowUp
{
    public function handle(Lead $lead, array $data): Lead
    {
        return DB::transaction(function () use ($lead, $data) {
            $now = now();
            
            // Only increment follow_up_count MAX once per day (unless it is the first follow-up)
            if ($lead->follow_up_count === 0 || !$lead->last_activity_at || !$lead->last_activity_at->isToday()) {
                $lead->increment('follow_up_count');
            }

            $lead->update(['last_activity_at' => $now]);

            $fupText = "Follow-up #" . $lead->follow_up_count;
            $msgSnippet = !empty($data['message']) ? ': "' . Str::limit($data['message'], 100) . '"' : '';
            $logMessage = "[$fupText]$msgSnippet";

            // Automation: 4x Follow-up -> Cold Leads
            $coldPhase = LeadPhase::where('code', 'cold-leads')->first();
            if ($lead->follow_up_count >= 4 && $coldPhase && $lead->lead_phase_id !== $coldPhase->id) {
                $lead->update(['lead_phase_id' => $coldPhase->id]);
                $logMessage .= " | Otomatis masuk ke Cold Leads.";
            }

            activity()
                ->performedOn($lead)
                ->causedBy(auth()->user())
                ->log($logMessage);

            // Explicitly record to lead_activities for Reporting
            \App\Domains\CRM\Domain\Models\LeadActivity::create([
                'lead_id' => $lead->id,
                'user_id' => auth()->id(),
                'type' => $data['type'] ?? 'message', // default to message/chat
                'description' => $data['message'] ?? $logMessage,
                'created_at' => $now
            ]);

            return $lead->refresh();
        });
    }
}


