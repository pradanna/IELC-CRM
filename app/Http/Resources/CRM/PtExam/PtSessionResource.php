<?php

namespace App\Http\Resources\Crm\PtExam;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\CRM\LeadResource;

class PtSessionResource extends JsonResource
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
            'lead_id' => $this->lead_id,
            'lead_name' => $this->lead?->name,
            'lead' => new LeadResource($this->whenLoaded('lead')),
            'pt_exam_id' => $this->pt_exam_id,
            'pt_exam' => new PtExamResource($this->whenLoaded('ptExam')),
            'token' => $this->token,
            'status' => $this->status,
            'scheduled_at' => $this->scheduled_at,
            'started_at' => $this->started_at,
            'finished_at' => $this->finished_at,
            'final_score' => $this->final_score,
            'recommended_level' => $this->recommended_level,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Magic link for the lead
            'magic_link' => $this->status === 'pending' || $this->status === 'in_progress' 
                ? config('app.url') . "/placement-test/" . $this->token 
                : null,
        ];
    }
}
