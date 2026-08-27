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
            $kidsQuestions = $this->kidsQuestions ?? collect();
            $kidsQuestions = $kidsQuestions->sortBy('position')->values();

            foreach ($kidsQuestions as $q) {
                $pages[] = [
                    'id' => 'kids_q_' . $q->id,
                    'type' => 'standalone',
                    'questions' => [[
                        'id' => $q->id,
                        'number' => $questionNumber++,
                        'type' => 'drag_drop',
                        'mode' => $q->mode,
                        'instruction' => $q->instruction,
                        'text' => $q->instruction ?? 'Interactive Canvas',
                        'audio_path' => $q->audio_path ? Storage::url($q->audio_path) : null,
                        'options' => [],
                        'kid_canvas' => [
                            'mode' => $q->mode,
                            'instruction' => $q->instruction,
                            'canvas_data' => $q->canvas_data,
                        ],
                    ]]
                ];
            }
            $totalQuestions = $questionNumber - 1;
        } elseif ($category === 'IELTS') {
            // IELTS PLACEMENT DIAGNOSTIC
            $ieltsTasks = $this->ieltsTasks ?? collect();
            $standaloneTasks = ($this->ieltsTasks ?? collect())->whereNull('pt_ielts_section_id');

            $items = collect();
            foreach ($standaloneTasks as $t) {
                $items->push((object)['type' => 'standalone', 'position' => $t->position, 'data' => $t]);
            }
            foreach ($ieltsTasks as $s) {
                $items->push((object)['type' => 'group', 'position' => $s->position, 'data' => $s]);
            }
            $items = $items->sortBy('position')->values();

            foreach ($items as $item) {
                if ($item->type === 'standalone') {
                    $t = $item->data;
                    $pages[] = [
                        'id' => 'ielts_t_' . $t->id,
                        'type' => 'standalone',
                        'questions' => [[
                            'id' => $t->id,
                            'number' => $questionNumber++,
                            'type' => $t->task_type === 'file_upload' ? 'file' : 'text',
                            'task_type' => $t->task_type,
                            'text' => $t->prompt_text,
                            'audio_path' => $t->audio_path ? Storage::url($t->audio_path) : null,
                            'resource_file_path' => $t->resource_file_path ? Storage::url($t->resource_file_path) : null,
                            'min_words' => $t->min_words,
                            'max_score' => $t->max_score,
                            'options' => [],
                        ]]
                    ];
                } else {
                    $s = $item->data;
                    $sectionTasks = [];
                    foreach ($s->tasks as $t) {
                        $sectionTasks[] = [
                            'id' => $t->id,
                            'number' => $questionNumber++,
                            'type' => $t->task_type === 'file_upload' ? 'file' : 'text',
                            'task_type' => $t->task_type,
                            'text' => $t->prompt_text,
                            'audio_path' => $t->audio_path ? Storage::url($t->audio_path) : null,
                            'resource_file_path' => $t->resource_file_path ? Storage::url($t->resource_file_path) : null,
                            'min_words' => $t->min_words,
                            'max_score' => $t->max_score,
                            'options' => [],
                        ];
                    }
                    $pages[] = [
                        'id' => 'ielts_s_' . $s->id,
                        'type' => 'group',
                        'section_type' => $s->section_type,
                        'title' => $s->title,
                        'instruction' => $s->instruction,
                        'reading_text' => $s->passage_text,
                        'audio_path' => $s->audio_path ? Storage::url($s->audio_path) : null,
                        'file_path' => $s->resource_file_path ? Storage::url($s->resource_file_path) : null,
                        'duration_minutes' => $s->duration_minutes,
                        'questions' => $sectionTasks,
                    ];
                }
            }
            $totalQuestions = $questionNumber - 1;
        } else {
            // GENERAL PLACEMENT TEST (Fallback / Legacy compatible)
            $generalGroups = $this->generalGroups ?? $this->ptQuestionGroups ?? collect();
            $generalQuestions = $this->generalQuestions ?? $this->questions ?? collect();
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
                            'number' => $questionNumber++,
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
                    foreach ($g->questions as $q) {
                        $groupQuestions[] = [
                            'id' => $q->id,
                            'number' => $questionNumber++,
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



