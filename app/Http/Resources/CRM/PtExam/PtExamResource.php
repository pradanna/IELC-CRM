<?php

namespace App\Http\Resources\Crm\PtExam;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PtExamResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'category' => $this->category,
            'slug' => $this->slug,
            'description' => $this->description,
            'duration_minutes' => $this->duration_minutes,
            'is_active' => $this->is_active,
            'questions_count' => $this->questions_count ?? $this->questions()->count(),
            'question_groups' => PtQuestionGroupResource::collection($this->whenLoaded('ptQuestionGroups')),
            'standalone_questions' => PtQuestionResource::collection($this->whenLoaded('questions')),
        ];
    }
}

