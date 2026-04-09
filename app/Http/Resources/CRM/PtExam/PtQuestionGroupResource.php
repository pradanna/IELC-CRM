<?php

namespace App\Http\Resources\Crm\PtExam;

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
            'audio_path' => $this->audio_path,
            'reading_text' => $this->reading_text,
            'questions' => PtQuestionResource::collection($this->whenLoaded('questions')),
        ];
    }
}
