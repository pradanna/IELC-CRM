<?php

namespace App\Actions\Crm\PtExam;

use App\Models\PtSession;
use App\Http\Resources\Crm\PtExam\PtExamPublicResource;

class GetPtSessionResultAction
{
    public function handle(PtSession $session): array
    {
        $session->load(['ptExam.questions.options', 'ptExam.ptQuestionGroups.questions.options', 'answers']);

        return [
            'session' => [
                'id' => $session->id,
                'final_score' => $session->final_score,
                'status' => $session->status,
                'is_graded' => $session->is_graded,
                'grading_notes' => $session->grading_notes,
                'grader_name' => $session->grader?->name,
                'recommended_level' => $session->recommended_level,
                'result_file_url' => $session->result_file_path ? \Illuminate\Support\Facades\Storage::url($session->result_file_path) : null,
            ],
            'exam' => new PtExamPublicResource($session->ptExam),
            'answers' => $session->answers->mapWithKeys(function ($answer) {
                return [$answer->pt_question_id => [
                    'option_id' => $answer->pt_question_option_id,
                    'answer_text' => $answer->answer_text,
                    'file_path' => $answer->file_path ? \Illuminate\Support\Facades\Storage::url($answer->file_path) : null,
                    'is_correct' => $answer->is_correct,
                ]];
            }),
        ];
    }
}

