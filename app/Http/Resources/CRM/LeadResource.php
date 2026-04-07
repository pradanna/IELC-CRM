<?php

namespace App\Http\Resources\CRM;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'lead_number'    => $this->lead_number,
            'name'           => $this->name,
            'email'          => $this->email,
            'phone'          => $this->phone,
            'city'           => $this->city,
            'province'       => $this->province,
            'is_online'      => (bool)$this->is_online,
            
            // Raw IDs for edit mode
            'branch_id'      => $this->branch_id,
            'lead_source_id' => $this->lead_source_id,
            'lead_type_id'   => $this->lead_type_id,
            'lead_phase_id'  => $this->lead_phase_id,
            
            // Relationships
            'branch'         => $this->whenLoaded('branch', fn() => [
                'id'         => $this->branch->id,
                'name'       => $this->branch->name,
            ]),
            'owner'          => $this->whenLoaded('owner', fn() => [
                'id'         => $this->owner->id,
                'name'       => $this->owner->name,
            ]),
            'creator'        => $this->whenLoaded('creator', fn() => [
                'id'         => $this->creator->id,
                'name'       => $this->creator->name,
            ]),
            'lead_source'    => $this->whenLoaded('leadSource', fn() => [
                'id'         => $this->leadSource->id,
                'name'       => $this->leadSource->name,
            ]),
            'lead_type'      => $this->whenLoaded('leadType', fn() => [
                'id'         => $this->leadType->id,
                'name'       => $this->leadType->name,
            ]),
            'lead_phase'     => $this->whenLoaded('leadPhase', fn() => [
                'id'         => $this->leadPhase->id,
                'name'       => $this->leadPhase->name,
                'code'       => $this->leadPhase->code,
            ]),
            
            'guardians'      => $this->whenLoaded('guardians'),
            'lead_relationships' => $this->whenLoaded('leadRelationships', fn() => 
                $this->leadRelationships->map(fn($r) => [
                    'related_lead_id'   => $r->related_lead_id,
                    'related_lead'      => $r->relatedLead ? ['name' => $r->relatedLead->name] : null,
                    'type'              => $r->type,
                    'is_main_contact'   => (bool)$r->is_main_contact,
                ])
            ),

            // Activity Logs (Spatie)
            'activities'     => $this->whenLoaded('activities', function() {
                return LeadActivityResource::collection($this->activities);
            }),

            'created_at'     => $this->created_at->toISOString(),
            'formatted_at'   => $this->created_at->format('d M Y'),
            'human_at'       => $this->created_at->diffForHumans(),
            'enrolled_at'    => $this->enrolled_at ? $this->enrolled_at->toISOString() : null,
            'formatted_enrolled_at' => $this->enrolled_at ? $this->enrolled_at->format('d M Y') : null,
        ];
    }
}
