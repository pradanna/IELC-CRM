<?php

namespace App\Domains\CRM\Application\Actions\Leads;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadNote;
use Illuminate\Support\Facades\DB;

class StoreLeadNote
{
    public function handle(Lead $lead, array $data): LeadNote
    {
        return DB::transaction(function () use ($lead, $data) {
            $note = LeadNote::create([
                'lead_id' => $lead->id,
                'user_id' => auth()->id(),
                'content' => $data['content'],
            ]);

            $lead->update([
                'last_activity_at' => now(),
            ]);

            activity()
                ->performedOn($lead)
                ->causedBy(auth()->user())
                ->log("Added a new note: " . \Illuminate\Support\Str::limit($data['content'], 50));

            return $note;
        });
    }
}
