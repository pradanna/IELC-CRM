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
            'nik'            => $this->nik,
            'school'         => $this->school,
            'grade'          => $this->grade,
            'school_level'   => $this->school_level,
            'full_grade'     => $this->school_level ? "{$this->grade} ({$this->school_level})" : $this->grade,
            'city'           => $this->city,
            'province'       => $this->province,
            'address'        => $this->address,
            'postal_code'    => $this->postal_code,
            'is_online'      => (bool)$this->is_online,
            'self_registration_token' => $this->self_registration_token,
            'pending_updates' => $this->pending_updates,
            'guardian_data'   => $this->guardian_data,
            'plotting'       => $this->plotting,
            'follow_up_count' => (int) ($this->follow_up_count ?? 0),
            'lead_notes'     => $this->whenLoaded('notes', fn() => 
                $this->notes->map(fn($n) => [
                    'id'         => $n->id,
                    'content'    => $n->content,
                    'user'       => [
                        'id'   => $n->user?->id,
                        'name' => $n->user?->name,
                    ],
                    'created_at' => $n->created_at->toISOString(),
                    'human_at'   => $n->created_at->diffForHumans(),
                ])
            ),
            'lead_activities' => $this->whenLoaded('activities', fn() => 
                $this->activities->sortByDesc('created_at')->values()->map(fn($a) => [
                    'id'          => $a->id,
                    'type'        => $a->type,
                    'description' => $a->description,
                    'user'        => [
                        'id'   => $a->user?->id,
                        'name' => $a->user?->name,
                    ],
                    'created_at'  => $a->created_at->toISOString(),
                    'formatted_at' => $a->created_at->format('d M Y, H:i'),
                    'human_at'    => $a->created_at->diffForHumans(),
                ])
            ),
            
            // Raw IDs for edit mode
            'branch_id'      => $this->branch_id,
            'lead_source_id' => $this->lead_source_id,
            'info_source_id' => $this->info_source_id,
            'lead_type_id'   => $this->lead_type_id,
            'lead_phase_id'  => $this->lead_phase_id,
            
            // Relationships
            'branch'         => $this->whenLoaded('branch', fn() => [
                'id'         => $this->branch->id,
                'name'       => $this->branch->name,
                'code'       => $this->branch->code,
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
            'info_source'    => $this->whenLoaded('infoSource', fn() => [
                'id'         => $this->infoSource->id,
                'name'       => $this->infoSource->name,
            ]),
            'lead_type'      => $this->whenLoaded('leadType', fn() => [
                'id'         => $this->leadType->id,
                'name'       => $this->leadType->name,
            ]),
            'lead_phase'     => $this->whenLoaded('leadPhase', fn() => [
                'id'         => $this->leadPhase->id,
                'name'       => $this->leadPhase->name,
                'code'       => $this->leadPhase->code,
                'status'     => $this->leadPhase->status,
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

            'enrollments' => $this->whenLoaded('enrollments', fn() => 
                $this->enrollments->map(fn($e) => [
                    'id'              => $e->id,
                    'study_class_id'  => $e->study_class_id,
                    'study_class'     => $e->studyClass ? [
                        'id'   => $e->studyClass->id,
                        'name' => $e->studyClass->name,
                    ] : null,
                    'invoice_id'      => $e->invoice_id,
                    'invoice_number'  => $e->invoice?->invoice_number,
                    'joined_at'       => $e->joined_at ? $e->joined_at->format('Y-m-d') : null,
                    'formatted_joined_at' => $e->joined_at ? $e->joined_at->format('d M Y') : null,
                    'end_date'        => $e->end_date ? $e->end_date->format('Y-m-d') : null,
                    'formatted_end_date' => $e->end_date ? $e->end_date->format('d M Y') : null,
                    'stopped_at'      => $e->stopped_at ? $e->stopped_at->format('Y-m-d') : null,
                    'status'          => $e->status ?? 'active',
                    'cycle_number'    => $e->cycle_number ?? 1,
                ])
            ),
            'enrollment_count' => $this->whenLoaded('enrollments', fn() => $this->enrollments->count(), $this->enrollments_count ?? 0),

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
            'last_activity_at' => $this->last_activity_at ? $this->last_activity_at->toISOString() : null,
            'formatted_last_activity_at' => $this->last_activity_at ? $this->last_activity_at->format('d M Y') : null,
            'human_last_activity_at' => $this->last_activity_at ? $this->last_activity_at->diffForHumans() : 'Belum ada aktivitas',
        ];
    }
}



