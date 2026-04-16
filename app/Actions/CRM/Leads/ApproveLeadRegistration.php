<?php

namespace App\Actions\Crm\Leads;

use App\Models\LeadRegistration;
use App\Models\LeadSource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ApproveLeadRegistration
{
    private StoreLead $storeLead;

    public function __construct(StoreLead $storeLead)
    {
        $this->storeLead = $storeLead;
    }

    public function handle(LeadRegistration $registration): void
    {
        DB::transaction(function () use ($registration) {
            // 1. Determine Lead Source
            $leadSourceId = $registration->lead_source_id;

            if (!$leadSourceId) {
                $source = LeadSource::firstOrCreate(
                    ['name' => 'Self-Registration'],
                    ['id' => Str::uuid()]
                );
                $leadSourceId = $source->id;
            }

            // 2. Prepare Data for StoreLead Action
            $guardians = [];
            if ($registration->guardian_data && !empty($registration->guardian_data)) {
                if (!empty($registration->guardian_data['father_name'])) {
                    $guardians[] = [
                        'role' => 'ayah',
                        'name' => $registration->guardian_data['father_name'],
                        'phone' => $registration->guardian_data['father_phone'] ?? '',
                        'is_main_contact' => true
                    ];
                }
                if (!empty($registration->guardian_data['mother_name'])) {
                    $guardians[] = [
                        'role' => 'ibu',
                        'name' => $registration->guardian_data['mother_name'],
                        'phone' => $registration->guardian_data['mother_phone'] ?? '',
                        'is_main_contact' => empty($guardians) // If no father, mother is main
                    ];
                }
            }

            $leadData = [
                'name' => $registration->name,
                'nickname' => $registration->nickname,
                'phone' => $registration->phone,
                'email' => $registration->email,
                'gender' => $registration->gender,
                'birth_date' => $registration->birth_date,
                'school' => $registration->school,
                'grade' => $registration->grade,
                'branch_id' => $registration->branch_id,
                'lead_source_id' => $leadSourceId,
                'province' => $registration->province,
                'city' => $registration->city,
                'address' => $registration->address,
                'postal_code' => $registration->postal_code,
                'is_online' => true,
                'guardians' => $guardians,
            ];

            // 3. Promote to Official Lead
            $this->storeLead->handle($leadData);

            // 4. Update Registration Status
            $registration->update(['status' => 'approved']);
        });
    }
}

