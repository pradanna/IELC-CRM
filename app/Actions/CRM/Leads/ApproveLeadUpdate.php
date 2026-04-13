<?php

namespace App\Actions\CRM\Leads;

use App\Models\Lead;
use Illuminate\Support\Facades\DB;

class ApproveLeadUpdate
{
    public function handle(Lead $lead): void
    {
        DB::transaction(function () use ($lead) {
            if (!$lead->pending_updates) {
                return;
            }

            $updates = $lead->pending_updates;

            $lead->update([
                'name' => $updates['name'] ?? $lead->name,
                'nickname' => $updates['nickname'] ?? $lead->nickname,
                'phone' => $updates['phone'] ?? $lead->phone,
                'email' => $updates['email'] ?? $lead->email,
                'gender' => $updates['gender'] ?? $lead->gender,
                'birth_date' => $updates['birth_date'] ?? $lead->birth_date,
                'school' => $updates['school'] ?? $lead->school,
                'grade' => $updates['grade'] ?? $lead->grade,
                'province' => $updates['province'] ?? $lead->province,
                'city' => $updates['city'] ?? $lead->city,
                'address' => $updates['address'] ?? $lead->address,
                'postal_code' => $updates['postal_code'] ?? $lead->postal_code,
                'lead_source_id' => $updates['lead_source_id'] ?? $lead->lead_source_id,
                'pending_updates' => null,
                'last_activity_at' => now(),
            ]);
        });
    }
}
