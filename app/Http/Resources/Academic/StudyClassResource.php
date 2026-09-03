<?php

namespace App\Http\Resources\Academic;

use App\Http\Resources\Master\BranchResource;
use App\Http\Resources\Finance\PriceMasterResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudyClassResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $instructorName = null;
        if ($this->relationLoaded('instructor') && $this->instructor) {
            $instructorName = $this->instructor->superadmin?->name
                ?? $this->instructor->marketing?->name
                ?? $this->instructor->frontdesk?->name
                ?? $this->instructor->teacher?->name
                ?? $this->instructor->name
                ?? $this->instructor->email;
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type ?? 'offline',
            'category' => $this->category ?? 'group',
            'status' => $this->status ?? 'active',
            'branch_id' => $this->branch_id,
            'instructor_id' => $this->instructor_id,
            'price_master_id' => $this->price_master_id,
            'schedule_days' => $this->schedule_days,
            'start_session_date' => $this->start_session_date ? $this->start_session_date->format('Y-m-d') : null,
            'end_session_date' => $this->end_session_date ? $this->end_session_date->format('Y-m-d') : null,
            'total_meetings' => $this->total_meetings,
            'meetings_per_week' => $this->meetings_per_week,
            'current_session_number' => $this->current_session_number,
            'manual_session_progress' => $this->manual_session_progress,
            'session_progress' => $this->session_progress,
            'is_expired' => (bool) $this->is_expired,
            'is_private' => (bool) $this->is_private,
            'students_count' => $this->whenCounted('students'),

            // Relationships
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'instructor' => $this->whenLoaded('instructor'),
            'instructor_name' => $instructorName,
            'price_master' => new PriceMasterResource($this->whenLoaded('priceMaster')),
            'students' => StudentResource::collection($this->whenLoaded('students')),
            'attendances' => $this->whenLoaded('currentCycleAttendances', function () {
                return $this->currentCycleAttendances->map(function ($att) {
                    return [
                        'id' => $att->id,
                        'session_number' => $att->session_number,
                        'cycle_number' => $att->cycle_number,
                        'attendance_date' => $att->attendance_date ? $att->attendance_date->format('Y-m-d') : null,
                        'status' => $att->status,
                        'topic' => $att->topic,
                        'notes' => $att->notes,
                        'student_id' => $att->student_id,
                        'student_name' => $att->student?->lead?->name,
                        'recorder_name' => $att->recorder?->name ?? $att->recorder?->email,
                        'created_at' => $att->created_at ? $att->created_at->format('d M Y H:i') : null,
                    ];
                });
            }),
            'pending_bulk_invoices_count' => $this->pending_bulk_invoices_count ?? null,
            'paid_bulk_invoices_count' => $this->paid_bulk_invoices_count ?? null,
        ];
    }
}
