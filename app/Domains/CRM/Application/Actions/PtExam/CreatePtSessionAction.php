<?php

namespace App\Domains\CRM\Application\Actions\PtExam;

use App\Domains\Academic\Domain\Models\PtSession;
use Illuminate\Support\Str;

class CreatePtSessionAction
{
    public function handle(array $data): PtSession
    {
        // Auto-generate unique token for the magic link if not provided
        if (empty($data['token'])) {
            $data['token'] = Str::random(40);
        }

        $session = PtSession::create($data);

        // Update Lead Milestone
        $lead = \App\Domains\CRM\Domain\Models\Lead::find($data['lead_id']);
        if ($lead && is_null($lead->first_pt_at)) {
            $lead->update(['first_pt_at' => now()]);
        }

        return $session;
    }
}



