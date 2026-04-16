<?php

namespace App\Actions\Crm\Leads;

use App\Models\Lead;
use Illuminate\Support\Facades\DB;

class ResetLeadFollowUp
{
    public function handle(Lead $lead): Lead
    {
        return DB::transaction(function () use ($lead) {
            if ($lead->follow_up_count > 0) {
                $lead->update([
                    'follow_up_count' => 0,
                    'last_activity_at' => now(),
                ]);
                
                activity()
                    ->performedOn($lead)
                    ->causedBy(auth()->user())
                    ->log("Follow-up counter reset to 0 (Lead responded)");
            }

            return $lead->refresh();
        });
    }
}

