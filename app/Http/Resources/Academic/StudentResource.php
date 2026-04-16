<?php

namespace App\Http\Resources\Academic;

use App\Http\Resources\Crm\LeadResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_number' => $this->student_number,
            'lead_id' => $this->lead_id,
            'status' => $this->status,
            'enrolled_at' => $this->created_at->format('d M Y'),
            
            // Relationships
            'lead' => new LeadResource($this->whenLoaded('lead')),
            'study_classes' => StudyClassResource::collection($this->whenLoaded('studyClasses')),
        ];
    }
}

