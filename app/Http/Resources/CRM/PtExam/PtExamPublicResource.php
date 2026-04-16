<?php

namespace App\Http\Resources\Crm\PtExam;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PtExamPublicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $questionNumber = 1;

        // Combine standalone questions & groups
        $items = collect();
        foreach ($this->questions->whereNull('pt_question_group_id') as $q) {
            $items->push((object)['type' => 'standalone', 'position' => $q->position, 'data' => $q]);
        }
        foreach ($this->ptQuestionGroups as $g) {
            $items->push((object)['type' => 'group', 'position' => $g->position, 'data' => $g]);
        }
        $items = $items->sortBy('position')->values();

        $pages = [];
        foreach ($items as $item) {
            if ($item->type === 'standalone') {
                $q = $item->data;
                $pages[] = [
                    'id' => 'q_' . $q->id,
                    'type' => 'standalone',
                    'questions' => [[
                        'id' => $q->id,
                        'number' => $questionNumber++,
                        'type' => $q->type,
                        'text' => $q->question_text,
                        'audio_path' => $q->audio_path ? Storage::url($q->audio_path) : null,
                        'options' => $q->options->map(fn($o) => ['id' => $o->id, 'text' => $o->option_text]),
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
                        'options' => $q->options->map(fn($o) => ['id' => $o->id, 'text' => $o->option_text]),
                    ];
                }
                $pages[] = [
                    'id' => 'g_' . $g->id,
                    'type' => 'group',
                    'instruction' => $g->instruction,
                    'section_type' => $g->section_type,
                    'reading_text' => $g->reading_text,
                    'audio_path' => $g->audio_path ? Storage::url($g->audio_path) : null,
                    'file_path' => $g->file_path ? Storage::url($g->file_path) : null,
                    'questions' => $groupQuestions,
                ];
            }
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'category' => $this->category,
            'description' => $this->description,
            'duration_minutes' => $this->duration_minutes,
            'slug' => $this->slug,
            'pages' => $pages,
            'total_questions' => $questionNumber - 1,
        ];
    }
}

