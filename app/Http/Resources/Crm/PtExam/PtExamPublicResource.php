<?php

namespace App\Http\Resources\Crm\PtExam;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PtExamPublicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $category = $this->category ?? 'General';
        $pages = [];
        $totalQuestions = 0;
        $questionNumber = 1;

        if ($category === 'Kids') {
            // KIDS PLACEMENT TEST: Every question is an interactive canvas page (No Theme Stage group box)
            $kidsQuestions = $this->kidsQuestions && $this->kidsQuestions->isNotEmpty()
                ? $this->kidsQuestions->sortBy('position')->values()
                : ($this->questions ?? collect())->sortBy('position')->values();

            foreach ($kidsQuestions as $q) {
                $canvasData = $q->canvas_data ?? $q->kidCanvas?->canvas_data;
                $mode = $q->mode ?? $q->kidCanvas?->mode ?? 'freeform_canvas';
                $instruction = $q->instruction ?? $q->kidCanvas?->instruction ?? $q->question_text;

                $pages[] = [
                    'id' => 'kids_q_' . $q->id,
                    'type' => 'standalone',
                    'questions' => [[
                        'id' => $q->id,
                        'number' => $questionNumber++,
                        'type' => 'drag_drop',
                        'mode' => $mode,
                        'instruction' => $instruction,
                        'text' => $instruction ?? 'Interactive Canvas',
                        'audio_path' => $q->audio_path ? (str_starts_with($q->audio_path, 'http') ? $q->audio_path : Storage::url($q->audio_path)) : null,
                        'options' => [],
                        'kid_canvas' => [
                            'mode' => $mode,
                            'instruction' => $instruction,
                            'canvas_data' => $canvasData,
                        ],
                    ]]
                ];
            }
            $totalQuestions = $questionNumber - 1;
        } elseif ($category === 'IELTS') {
            // IELTS PLACEMENT TEST / DIAGNOSTIC
            $ieltsTasks = ($this->ieltsTasks ?? collect())->sortBy('position')->values();

            foreach ($ieltsTasks as $index => $t) {
                $audioUrl = $t->audio_path
                    ? (str_starts_with($t->audio_path, 'http') ? $t->audio_path : Storage::url($t->audio_path))
                    : null;
                $questionPdfUrl = $t->question_pdf_path
                    ? (str_starts_with($t->question_pdf_path, 'http') ? $t->question_pdf_path : Storage::url($t->question_pdf_path))
                    : null;
                $answerSheetPdfUrl = $t->answer_sheet_pdf_path
                    ? (str_starts_with($t->answer_sheet_pdf_path, 'http') ? $t->answer_sheet_pdf_path : Storage::url($t->answer_sheet_pdf_path))
                    : null;

                $pages[] = [
                    'id' => 'ielts_t_' . $t->id,
                    'type' => 'standalone',
                    'questions' => [[
                        'id' => $t->id,
                        'number' => $questionNumber++,
                        'skill_type' => $t->skill_type,
                        'title' => $t->title,
                        'type' => 'ielts_task',
                        'task_type' => $t->skill_type,
                        'question_text' => $t->title,
                        'text' => $t->title,
                        'description' => $t->description,
                        'audio_path' => $audioUrl,
                        'question_pdf_path' => $questionPdfUrl,
                        'answer_sheet_pdf_path' => $answerSheetPdfUrl,
                        'min_words' => $t->min_words,
                        'duration_minutes' => $t->duration_minutes,
                        'points' => $t->max_score ?? 9.0,
                        'max_score' => $t->max_score ?? 9.0,
                        'options' => [],
                    ]]
                ];
            }
            $totalQuestions = $questionNumber - 1;
        } else {
            // GENERAL PLACEMENT TEST (Fallback / Legacy compatible)
            $generalGroups = ($this->relationLoaded('generalGroups') && $this->generalGroups->isNotEmpty()) 
                ? $this->generalGroups 
                : ($this->generalGroups()->exists() ? $this->generalGroups : $this->ptQuestionGroups);

            $generalQuestions = ($this->relationLoaded('generalQuestions') && $this->generalQuestions->isNotEmpty()) 
                ? $this->generalQuestions 
                : ($this->generalQuestions()->exists() ? $this->generalQuestions : $this->questions);

            $standaloneQuestions = $generalQuestions->whereNull('pt_general_question_group_id')->whereNull('pt_question_group_id');

            $items = collect();
            foreach ($standaloneQuestions as $q) {
                $items->push((object)['type' => 'standalone', 'position' => $q->position, 'data' => $q]);
            }
            foreach ($generalGroups as $g) {
                $items->push((object)['type' => 'group', 'position' => $g->position, 'data' => $g]);
            }
            $items = $items->sortBy('position')->values();

            foreach ($items as $item) {
                if ($item->type === 'standalone') {
                    $q = $item->data;
                    $pages[] = [
                        'id' => 'gen_q_' . $q->id,
                        'type' => 'standalone',
                        'questions' => [[
                            'id' => $q->id,
                            'number' => $q->number ?? $questionNumber++,
                            'type' => $q->type,
                            'text' => $q->question_text,
                            'audio_path' => $q->audio_path ? Storage::url($q->audio_path) : null,
                            'options' => ($q->options ?? collect())->map(function($o) {
                                $res = ['id' => $o->id, 'text' => $o->option_text];
                                if (auth()->check()) {
                                    $res['is_correct'] = (bool) $o->is_correct;
                                }
                                return $res;
                            }),
                        ]]
                    ];
                } else {
                    $g = $item->data;
                    $groupQuestions = [];
                    $sortedGroupQuestions = $g->questions->sortBy(function($q) {
                        return [$q->position ?? 0, $q->number ?? 0];
                    });
                    foreach ($sortedGroupQuestions as $q) {
                        $groupQuestions[] = [
                            'id' => $q->id,
                            'number' => $q->number ?? $questionNumber++,
                            'type' => $q->type,
                            'text' => $q->question_text,
                            'audio_path' => $q->audio_path ? Storage::url($q->audio_path) : null,
                            'options' => ($q->options ?? collect())->map(function($o) {
                                $res = ['id' => $o->id, 'text' => $o->option_text];
                                if (auth()->check()) {
                                    $res['is_correct'] = (bool) $o->is_correct;
                                }
                                return $res;
                            }),
                        ];
                    }
                    $pages[] = [
                        'id' => 'gen_g_' . $g->id,
                        'type' => 'group',
                        'instruction' => $g->instruction,
                        'section_type' => $g->section_type ?? null,
                        'reading_text' => $g->reading_text,
                        'audio_path' => $g->audio_path ? Storage::url($g->audio_path) : null,
                        'file_path' => $g->file_path ? Storage::url($g->file_path) : null,
                        'questions' => $groupQuestions,
                    ];
                }
            }
            $totalQuestions = $questionNumber - 1;
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'category' => $this->category,
            'description' => $this->description,
            'duration_minutes' => $this->duration_minutes,
            'slug' => $this->slug,
            'pages' => $pages,
            'total_questions' => $totalQuestions,
        ];
    }
}



