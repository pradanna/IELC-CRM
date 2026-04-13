<?php

namespace App\Actions\CRM\Leads;

use App\Models\Lead;
use App\Models\LeadPhase;
use App\Models\LeadRelationship;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class StoreLead
{
    public function handle(array $data): Lead
    {
        return DB::transaction(function () use ($data) {
            $now = Carbon::now();
            // Generate Unique Lead Number based on datetime
            $leadNumber = "L-" . $now->format('Ymd-His');
            
            // Default Phase: 'lead' (status: new)
            $defaultPhase = LeadPhase::where('code', 'lead')->first();

            $lead = Lead::create([
                'id' => Str::uuid(),
                'lead_number' => $leadNumber,
                'name' => $data['name'],
                'nickname' => $data['nickname'] ?? null,
                'gender' => $data['gender'] ?? null,
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
                'birth_date' => $data['birth_date'] ?? null,
                'school' => $data['school'] ?? null,
                'grade' => $data['grade'] ?? null,
                'branch_id' => $data['branch_id'],
                'owner_id' => Auth::id(),
                'created_by' => Auth::id(),
                'lead_source_id' => $data['lead_source_id'] ?? null,
                'lead_type_id' => $data['lead_type_id'] ?? null,
                'lead_phase_id' => $defaultPhase?->id,
                'is_online' => $data['is_online'] ?? false,
                'province' => $data['province'] ?? null,
                'city' => $data['city'] ?? null,
                'address' => $data['address'] ?? null,
                'postal_code' => $data['postal_code'] ?? null,
                'follow_up_count' => 0,
                'last_activity_at' => now(),
            ]);

            // Handle Guardians
            if (!empty($data['guardians'])) {
                foreach ($data['guardians'] as $guardianData) {
                    $lead->guardians()->create([
                        'id' => Str::uuid(),
                        'role' => $guardianData['role'],
                        'name' => $guardianData['name'],
                        'phone' => $guardianData['phone'],
                        'occupation' => $guardianData['occupation'] ?? null,
                        'is_main_contact' => $guardianData['is_main_contact'] ?? false,
                    ]);
                }
            }

            // Handle Relationships
            if (!empty($data['relationships'])) {
                foreach ($data['relationships'] as $relData) {
                    $lead->leadRelationships()->create([
                        'id' => Str::uuid(),
                        'related_lead_id' => $relData['related_lead_id'],
                        'type' => $relData['type'] ?? 'sibling',
                        'is_main_contact' => $relData['is_main_contact'] ?? false,
                    ]);

                    // Bidirectional link
                    LeadRelationship::create([
                        'id' => Str::uuid(),
                        'lead_id' => $relData['related_lead_id'],
                        'related_lead_id' => $lead->id,
                        'type' => $this->getOppositeType($relData['type'] ?? 'sibling'),
                        'is_main_contact' => false,
                    ]);
                }
            }

            return $lead;
        });
    }

    private function getOppositeType(string $type): string
    {
        return match($type) {
            'parent' => 'child',
            'child' => 'parent',
            default => $type,
        };
    }
}
