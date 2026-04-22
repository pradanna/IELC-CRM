<?php

namespace App\Actions\Crm\Leads;

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

            // Handle Guardians Update
            if (isset($updates['guardian_data']) && is_array($updates['guardian_data'])) {
                $gd = $updates['guardian_data'];
                if (!empty($gd['father_name'])) {
                    $lead->guardians()->updateOrCreate(
                        ['role' => 'ayah'],
                        [
                            'name' => $gd['father_name'],
                            'phone' => $gd['father_phone'] ?? '',
                        ]
                    );
                }
                if (!empty($gd['mother_name'])) {
                    $lead->guardians()->updateOrCreate(
                        ['role' => 'ibu'],
                        [
                            'name' => $gd['mother_name'],
                            'phone' => $gd['mother_phone'] ?? '',
                        ]
                    );
                }
            }
        });
    }
}

