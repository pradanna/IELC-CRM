<?php

namespace App\Http\Resources\CRM\PtExam;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PtQuestionGroupResource extends JsonResource
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
            'pt_exam_id' => $this->pt_exam_id,
            'instruction' => $this->instruction,
            'audio_path' => $this->audio_path ? \Illuminate\Support\Facades\Storage::url($this->audio_path) : null,
            'reading_text' => $this->reading_text,
            'position' => $this->position,
            'questions' => PtQuestionResource::collection($this->whenLoaded('questions')),
        ];
    }
}
