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
        return [
            'id' => $this->id,
            'name' => $this->name,
            'branch_id' => $this->branch_id,
            'instructor_id' => $this->instructor_id,
            'price_master_id' => $this->price_master_id,
            'schedule_days' => $this->schedule_days,
            'start_session_date' => $this->start_session_date ? $this->start_session_date->format('Y-m-d') : null,
            'end_session_date' => $this->end_session_date ? $this->end_session_date->format('Y-m-d') : null,
            'total_meetings' => $this->total_meetings,
            'meetings_per_week' => $this->meetings_per_week,
            'current_session_number' => $this->current_session_number,
            'session_progress' => $this->session_progress,
            'schedule_days' => $this->schedule_days,
            'students_count' => $this->whenCounted('students'),

            // Relationships
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'instructor' => $this->whenLoaded('instructor'), // Can use a UserResource if created
            'price_master' => new PriceMasterResource($this->whenLoaded('priceMaster')),
            'students' => StudentResource::collection($this->whenLoaded('students')),
        ];
    }
}
