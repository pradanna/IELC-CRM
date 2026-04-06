<?php

namespace App\Actions\Admin\CRM;

use App\Models\Lead;
use Illuminate\Support\Str;

class UpdateLead
{
    public function handle(Lead $lead, array $data): Lead
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($lead, $data) {
            
            $lead->update([
                'name' => $data['name'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
                'branch_id' => $data['branch_id'],
                'lead_source_id' => $data['lead_source_id'] ?? null,
                'lead_type_id' => $data['lead_type_id'] ?? null,
                'is_online' => $data['is_online'] ?? false,
                'province' => $data['province'] ?? null,
                'city' => $data['city'] ?? null,
                'last_activity_at' => now(),
            ]);

            // Handle Guardians (Sync approach: delete old, create new to be safe and simple)
            $lead->guardians()->delete();
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
            // Remove old bidirectional links first
            $oldRelations = $lead->leadRelationships;
            foreach ($oldRelations as $oldRel) {
                // Delete the opposite link
                \App\Models\LeadRelationship::where('lead_id', $oldRel->related_lead_id)
                    ->where('related_lead_id', $lead->id)
                    ->delete();
            }
            $lead->leadRelationships()->delete();

            if (!empty($data['relationships'])) {
                foreach ($data['relationships'] as $relData) {
                    $lead->leadRelationships()->create([
                        'id' => Str::uuid(),
                        'related_lead_id' => $relData['related_lead_id'],
                        'type' => $relData['type'] ?? 'sibling',
                        'is_main_contact' => $relData['is_main_contact'] ?? false,
                    ]);

                    // Bidirectional link
                    \App\Models\LeadRelationship::create([
                        'id' => Str::uuid(),
                        'lead_id' => $relData['related_lead_id'],
                        'related_lead_id' => $lead->id,
                        'type' => $this->getOppositeType($relData['type'] ?? 'sibling'),
                        'is_main_contact' => false,
                    ]);
                }
            }

            return $lead->refresh();
        });
    }

    private function getOppositeType(string $type): string
    {
        return match($type) {
            'parent' => 'child',
            'child' => 'parent',
            default => $type, // sibling, guardian, etc
        };
    }
}
