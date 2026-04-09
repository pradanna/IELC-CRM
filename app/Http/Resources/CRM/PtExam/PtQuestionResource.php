<?php

namespace App\Http\Resources\Crm\PtExam;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PtQuestionResource extends JsonResource
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
            'pt_question_group_id' => $this->pt_question_group_id,
            'question_text' => $this->question_text,
            'audio_path' => $this->audio_path ? \Illuminate\Support\Facades\Storage::url($this->audio_path) : null,
            'points' => $this->points,
            'number' => $this->number,
            'position' => $this->position,
            'options' => PtQuestionOptionResource::collection($this->whenLoaded('options')),
        ];
    }
}
