<?php

namespace App\Actions\Crm\PtExam;

use App\Models\PtQuestion;
use App\Models\PtQuestionOption;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CreatePtQuestionAction
{
    public function handle(array $data): PtQuestion
    {
        return DB::transaction(function () use ($data) {
            $questionData = [
                'pt_exam_id' => $data['pt_exam_id'],
                'pt_question_group_id' => $data['pt_question_group_id'] ?? null,
                'type' => $data['type'] ?? 'mcq',
                'question_text' => $data['question_text'],
                'points' => $data['points'] ?? 1,
                'number' => $this->getNextQuestionNumber($data['pt_exam_id']),
                'position' => $this->getNextPosition($data['pt_exam_id']),
            ];

            if (isset($data['media']) && $data['media']->isValid()) {
                $questionData['audio_path'] = $data['media']->store('pt_exams/audio', 'public');
            }

            $question = PtQuestion::create($questionData);

            if ($questionData['type'] === 'mcq' && isset($data['options']) && is_array($data['options'])) {
                foreach ($data['options'] as $index => $optionText) {
                    PtQuestionOption::create([
                        'pt_question_id' => $question->id,
                        'option_text' => $optionText,
                        'is_correct' => ($data['correct_answer'] == $index),
                    ]);
                }
            }

            return $question;
        });
    }

    private function getNextQuestionNumber(string $examId): int
    {
        return PtQuestion::where('pt_exam_id', $examId)->count() + 1;
    }

    private function getNextPosition(string $examId): int
    {
        $maxGroup = DB::table('pt_question_groups')->where('pt_exam_id', $examId)->max('position') ?? 0;
        $maxQuestion = DB::table('pt_questions')->where('pt_exam_id', $examId)->whereNull('pt_question_group_id')->max('position') ?? 0;
        
        return max($maxGroup, $maxQuestion) + 1;
    }
}

