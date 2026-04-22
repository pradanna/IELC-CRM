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
                'name' => array_key_exists('name', $updates) ? $updates['name'] : $lead->name,
                'nickname' => array_key_exists('nickname', $updates) ? $updates['nickname'] : $lead->nickname,
                'phone' => array_key_exists('phone', $updates) ? $updates['phone'] : $lead->phone,
                'email' => array_key_exists('email', $updates) ? $updates['email'] : $lead->email,
                'gender' => array_key_exists('gender', $updates) ? $updates['gender'] : $lead->gender,
                'birth_date' => array_key_exists('birth_date', $updates) ? $updates['birth_date'] : $lead->birth_date,
                'school' => array_key_exists('school', $updates) ? $updates['school'] : $lead->school,
                'grade' => array_key_exists('grade', $updates) ? $updates['grade'] : $lead->grade,
                'province' => array_key_exists('province', $updates) ? $updates['province'] : $lead->province,
                'city' => array_key_exists('city', $updates) ? $updates['city'] : $lead->city,
                'address' => array_key_exists('address', $updates) ? $updates['address'] : $lead->address,
                'postal_code' => array_key_exists('postal_code', $updates) ? $updates['postal_code'] : $lead->postal_code,
                'lead_source_id' => array_key_exists('lead_source_id', $updates) ? $updates['lead_source_id'] : $lead->lead_source_id,
                'pending_updates' => null,
                'last_activity_at' => now(),
            ]);
        });
    }
}

