<?php

namespace App\Actions\Admin\CRM;

use App\Models\Lead;
use App\Models\LeadPhase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Carbon\Carbon;

class StoreLead
{
    public function handle(array $data): Lead
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($data) {
            $now = Carbon::now();
            $datePrefix = $now->format('Ymd');
            
            // Find the next sequence for the day
            $lastLead = Lead::whereDate('created_at', $now->toDateString())
                ->orderBy('created_at', 'desc')
                ->first();

            $sequence = 1;
            if ($lastLead) {
                $lastLeadNumber = $lastLead->lead_number;
                $parts = explode('-', $lastLeadNumber);
                $lastSequence = (int) end($parts);
                $sequence = $lastSequence + 1;
            }

            $leadNumber = "L-{$datePrefix}-" . str_pad($sequence, 4, '0', STR_PAD_LEFT);
            
            // Default Phase: 'lead' (status: new)
            $defaultPhase = LeadPhase::where('code', 'lead')->first();

            $lead = Lead::create([
                'id' => Str::uuid(),
                'lead_number' => $leadNumber,
                'name' => $data['name'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
                'branch_id' => $data['branch_id'],
                'owner_id' => Auth::id(),
                'lead_source_id' => $data['lead_source_id'] ?? null,
                'lead_type_id' => $data['lead_type_id'] ?? null,
                'lead_phase_id' => $defaultPhase?->id,
                'is_online' => $data['is_online'] ?? false,
                'province' => $data['province'] ?? null,
                'city' => $data['city'] ?? null,
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

                    // Bidirectional link (Optional but often useful for CRM logic)
                    \App\Models\LeadRelationship::create([
                        'id' => Str::uuid(),
                        'lead_id' => $relData['related_lead_id'],
                        'related_lead_id' => $lead->id,
                        'type' => $this->getOppositeType($relData['type'] ?? 'sibling'),
                        'is_main_contact' => false, // Only one can be main contact usually
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
            default => $type, // sibling, guardian, etc are symmetric usually
        };
    }
}
