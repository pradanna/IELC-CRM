<?php

namespace App\Http\Resources\Crm\PtExam;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PtQuestionOptionResource extends JsonResource
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
            'pt_question_id' => $this->pt_question_id,
            'option_text' => $this->option_text,
            // 'is_correct' is intentionally hidden for regular users
        ];
    }
}
