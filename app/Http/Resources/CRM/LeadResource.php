<?php

namespace App\Http\Resources\Crm;

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
            'nickname'       => $this->nickname,
            'gender'         => $this->gender,
            'email'          => $this->email,
            'phone'          => $this->phone,
            'birth_date'     => $this->birth_date ? $this->birth_date->format('Y-m-d') : null,
            'school'         => $this->school,
            'grade'          => $this->grade,
            'city'           => $this->city,
            'province'       => $this->province,
            'is_online'      => (bool)$this->is_online,
            'self_registration_token' => $this->self_registration_token,
            'plotting'       => $this->plotting,
            'notes'          => $this->notes,
            
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

            'pt_sessions'    => \App\Http\Resources\Crm\PtExam\PtSessionResource::collection($this->whenLoaded('ptSessions')),

            'consultations'  => $this->whenLoaded('consultations', fn() => 
                $this->consultations->map(fn($c) => [
                    'id'                => $c->id,
                    'consultant_name'   => $c->consultant?->name,
                    'consultation_date' => $c->consultation_date->format('Y-m-d'),
                    'formatted_date'    => $c->consultation_date->format('d M Y'),
                    'notes'             => $c->notes,
                    'recommended_level' => $c->recommended_level,
                    'follow_up_note'    => $c->follow_up_note,
                    'metadata'          => $c->metadata,
                    'created_at'        => $c->created_at->toISOString(),
                ])
            ),

            'invoices'  => $this->whenLoaded('invoices', fn() => 
                $this->invoices->map(fn($v) => [
                    'id'             => $v->id,
                    'invoice_number' => $v->invoice_number,
                    'total_amount'   => $v->total_amount,
                    'status'         => $v->status,
                    'download_url'   => route('public.invoice.download', $v->id),
                    'paid_at'        => $v->paid_at ? $v->paid_at->format('d M Y') : null,
                ])
            ),

            'student'   => $this->whenLoaded('student', fn() => [
                'id'            => $this->student->id,
                'study_classes' => $this->student->studyClasses->map(fn($sc) => [
                    'id'   => $sc->id,
                    'name' => $sc->name,
                ]),
            ]),

            'chat_logs' => $this->whenLoaded('chatLogs', fn() => 
                $this->chatLogs->map(fn($log) => [
                    'id'                => $log->id,
                    'template_title'    => $log->template?->title ?? 'Custom/External',
                    'message'           => $log->message,
                    'sender_name'       => $log->sender?->name,
                    'lead_phase_id'     => $log->lead_phase_id,
                    'created_at'        => $log->created_at->toISOString(),
                    'formatted_date'    => $log->created_at->format('d M Y, H:i'),
                ])
            ),

            'created_at'     => $this->created_at->toISOString(),
            'formatted_at'   => $this->created_at->format('d M Y'),
            'human_at'       => $this->created_at->diffForHumans(),
            'enrolled_at'    => $this->enrolled_at ? $this->enrolled_at->toISOString() : null,
            'formatted_enrolled_at' => $this->enrolled_at ? $this->enrolled_at->format('d M Y') : null,
        ];
    }
}

