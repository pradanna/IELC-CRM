<?php

namespace App\Http\Resources\Crm\PtExam;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Crm\LeadResource;

class PtSessionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $stats = null;
        if ($this->status === 'completed') {
            try {
                $reportData = app(\App\Domains\Academic\Application\Services\PtReportService::class)->getReportData($this->resource);
                $stats = [
                    'total_questions' => $reportData['total_targets'] ?? 0,
                    'correct_answers' => $reportData['correct_targets'] ?? 0,
                    'percentage' => $reportData['percentage'] ?? null,
                    'unit_label' => $reportData['unit_label'] ?? 'Soal',
                ];
            } catch (\Throwable $e) {
                // fallback silently
            }
        }

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
            'is_graded' => $this->is_graded,
            'graded_by' => $this->graded_by,
            'grader_name' => $this->grader?->name,
            'grading_notes' => $this->grading_notes,
            'result_file_url' => $this->result_file_path ? \Illuminate\Support\Facades\Storage::url($this->result_file_path) : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'stats' => $stats,
            'total_questions' => $stats['total_questions'] ?? null,
            'correct_answers' => $stats['correct_answers'] ?? null,
            'percentage' => $stats['percentage'] ?? null,
            // Magic link for the lead
            'magic_link' => $this->status === 'pending' || $this->status === 'in_progress' 
                ? config('app.url') . "/placement-test/" . $this->token 
                : null,
        ];
    }
}



