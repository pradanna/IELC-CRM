<?php

namespace App\Http\Resources\Crm\PtExam;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            'questions_count' => $this->questions_count ?? ($this->generalQuestions()->count() + $this->kidsQuestions()->count() + $this->ieltsTasks()->count() + $this->questions()->count()),
            'has_sessions' => $this->pt_sessions_count !== null ? $this->pt_sessions_count > 0 : $this->ptSessions()->exists(),
            'question_groups' => (function() {
                if ($this->category === 'Kids' || $this->category === 'IELTS') {
                    return [];
                } else {
                    $groups = $this->generalGroups->isNotEmpty() ? $this->generalGroups : $this->ptQuestionGroups;
                    return $groups->map(fn($g) => [
                        'id' => $g->id,
                        'instruction' => $g->instruction,
                        'reading_text' => $g->reading_text,
                        'audio_path' => $g->audio_path ? (str_starts_with($g->audio_path, 'http') ? $g->audio_path : Storage::url($g->audio_path)) : null,
                        'file_path' => $g->file_path ? (str_starts_with($g->file_path, 'http') ? $g->file_path : Storage::url($g->file_path)) : null,
                        'position' => $g->position,
                        'questions' => $g->questions->map(fn($q) => [
                            'id' => $q->id,
                            'number' => $q->number,
                            'type' => $q->type,
                            'question_text' => $q->question_text,
                            'audio_path' => $q->audio_path ? (str_starts_with($q->audio_path, 'http') ? $q->audio_path : Storage::url($q->audio_path)) : null,
                            'points' => $q->points,
                            'position' => $q->position,
                            'options' => $q->options->map(fn($o) => ['id' => $o->id, 'text' => $o->option_text, 'is_correct' => $o->is_correct]),
                        ]),
                    ]);
                }
            })(),
            'standalone_questions' => (function() {
                if ($this->category === 'Kids') {
                    if ($this->kidsQuestions && $this->kidsQuestions->isNotEmpty()) {
                        return $this->kidsQuestions->map(fn($q) => [
                            'id' => $q->id,
                            'number' => $q->number,
                            'type' => 'drag_drop',
                            'mode' => $q->mode,
                            'question_text' => $q->instruction ?? 'Interactive Canvas',
                            'instruction' => $q->instruction,
                            'audio_path' => $q->audio_path,
                            'points' => $q->points,
                            'position' => $q->position,
                            'kid_canvas' => ['canvas_data' => $q->canvas_data, 'mode' => $q->mode],
                        ])->values();
                    }

                    // Fallback to pt_questions with kidCanvas / canvas_data
                    return $this->questions->map(fn($q) => [
                        'id' => $q->id,
                        'number' => $q->number,
                        'type' => 'drag_drop',
                        'mode' => $q->kidCanvas?->mode ?? 'freeform_canvas',
                        'question_text' => $q->question_text ?? 'Interactive Canvas Task',
                        'instruction' => $q->kidCanvas?->instruction ?? $q->question_text,
                        'audio_path' => $q->audio_path ? (str_starts_with($q->audio_path, 'http') ? $q->audio_path : Storage::url($q->audio_path)) : null,
                        'points' => $q->points,
                        'position' => $q->position,
                        'kid_canvas' => [
                            'canvas_data' => $q->kidCanvas?->canvas_data,
                            'mode' => $q->kidCanvas?->mode ?? 'freeform_canvas',
                        ],
                    ])->values();
                } elseif ($this->category === 'IELTS') {
                    return $this->ieltsTasks->map(fn($t, $idx) => [
                        'id' => $t->id,
                        'number' => $idx + 1,
                        'skill_type' => $t->skill_type,
                        'title' => $t->title,
                        'type' => 'ielts_task',
                        'task_type' => $t->skill_type,
                        'question_text' => $t->title,
                        'description' => $t->description,
                        'audio_path' => $t->audio_path ? (str_starts_with($t->audio_path, 'http') ? $t->audio_path : Storage::url($t->audio_path)) : null,
                        'question_pdf_path' => $t->question_pdf_path ? (str_starts_with($t->question_pdf_path, 'http') ? $t->question_pdf_path : Storage::url($t->question_pdf_path)) : null,
                        'answer_sheet_pdf_path' => $t->answer_sheet_pdf_path ? (str_starts_with($t->answer_sheet_pdf_path, 'http') ? $t->answer_sheet_pdf_path : Storage::url($t->answer_sheet_pdf_path)) : null,
                        'min_words' => $t->min_words,
                        'duration_minutes' => $t->duration_minutes,
                        'points' => $t->max_score,
                        'position' => $t->position,
                    ]);
                } else {
                    $standalone = $this->generalQuestions->isNotEmpty()
                        ? $this->generalQuestions->whereNull('pt_general_question_group_id')
                        : $this->questions->whereNull('pt_question_group_id');

                    return $standalone->map(fn($q) => [
                        'id' => $q->id,
                        'number' => $q->number,
                        'type' => $q->type,
                        'question_text' => $q->question_text,
                        'audio_path' => $q->audio_path ? (str_starts_with($q->audio_path, 'http') ? $q->audio_path : Storage::url($q->audio_path)) : null,
                        'points' => $q->points,
                        'position' => $q->position,
                        'options' => ($q->options ?? collect())->values()->map(fn($o) => ['id' => $o->id, 'text' => $o->option_text, 'is_correct' => $o->is_correct]),
                    ])->values();
                }
            })(),
        ];
    }
}