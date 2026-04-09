<?php

namespace App\Actions\Crm\PtExam;

use App\Models\PtQuestion;
use App\Models\PtQuestionOption;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CreatePtQuestionAction
{
    public function execute(array $data): PtQuestion
    {
        return DB::transaction(function () use ($data) {
            $questionData = [
                'pt_exam_id' => $data['pt_exam_id'],
                'pt_question_group_id' => $data['pt_question_group_id'] ?? null,
                'question_text' => $data['question_text'],
                'points' => $data['points'] ?? 1,
                'number' => $this->getNextNumber($data['pt_exam_id']),
            ];

            if (isset($data['media']) && $data['media']->isValid()) {
                $questionData['audio_path'] = $data['media']->store('pt_exams/audio', 'public');
            }

            $question = PtQuestion::create($questionData);

            if (isset($data['options']) && is_array($data['options'])) {
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

    private function getNextNumber(string $examId): int
    {
        return PtQuestion::where('pt_exam_id', $examId)->count() + 1;
    }
}
