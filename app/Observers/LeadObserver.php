<?php

namespace App\Observers;

use App\Models\Lead;
use App\Models\LeadPhase;

class LeadObserver
{
    /**
     * Handle the Lead "saving" event.
     * This covers both initial creation and updates.
     */
    public function saving(Lead $lead): void
    {
        // If lead_phase_id is changed or it's a new model being created
        if ($lead->isDirty('lead_phase_id') || !$lead->exists) {
            $phase = LeadPhase::find($lead->lead_phase_id);
            
            if (!$phase) return;

            $now = now();

            // 1. Prospective Tracking
            if ($phase->status === 'prospective' && !$lead->reached_prospective_at) {
                $lead->reached_prospective_at = $now;
            }

            // 2. Closing Tracking
            if ($phase->status === 'closing' && !$lead->enrolled_at) {
                $lead->enrolled_at = $now;
                // If they skip directly to closing, they also reached prospective
                if (!$lead->reached_prospective_at) {
                    $lead->reached_prospective_at = $now;
                }
            }

            // 3. Lost Tracking
            if ($phase->status === 'lost' && !$lead->lost_at) {
                $lead->lost_at = $now;
            }
        }
    }
}
