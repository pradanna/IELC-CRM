<?php

namespace App\Domains\Academic\Application\Actions\PtExam;

use App\Domains\Academic\Domain\Models\PtQuestion;
use App\Domains\Academic\Domain\Models\PtQuestionOption;
use Illuminate\Support\Facades\DB;

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
            } elseif ($questionData['type'] === 'drag_drop' && isset($data['canvas_data'])) {
                // Parse canvas_data if sent as JSON string or array
                $canvas = is_string($data['canvas_data']) ? json_decode($data['canvas_data'], true) : $data['canvas_data'];
                if (isset($canvas['items']) && is_array($canvas['items'])) {
                    foreach ($canvas['items'] as $item) {
                        // We store the item payload in option_text as JSON: { text, image, zone_id }
                        PtQuestionOption::create([
                            'pt_question_id' => $question->id,
                            'option_text' => json_encode($item),
                            'is_correct' => true,
                        ]);
                    }
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
