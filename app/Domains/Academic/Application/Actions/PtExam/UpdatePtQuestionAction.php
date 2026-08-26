<?php

namespace App\Domains\Academic\Application\Actions\PtExam;

use App\Domains\Academic\Domain\Models\PtQuestion;
use App\Domains\Academic\Domain\Models\PtQuestionOption;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class UpdatePtQuestionAction
{
    public function handle(PtQuestion $question, array $data): PtQuestion
    {
        return DB::transaction(function () use ($question, $data) {
            $questionData = [
                'type' => $data['type'] ?? $question->type,
                'question_text' => $data['question_text'],
                'points' => $data['points'] ?? 1,
            ];

            if (isset($data['media']) && $data['media']->isValid()) {
                if ($question->audio_path) {
                    Storage::disk('public')->delete($question->audio_path);
                }
                $questionData['audio_path'] = $data['media']->store('pt_exams/audio', 'public');
            }

            $question->update($questionData);

            if ($questionData['type'] === 'mcq' && isset($data['options']) && is_array($data['options'])) {
                $question->options()->delete();
                foreach ($data['options'] as $index => $optionText) {
                    PtQuestionOption::create([
                        'pt_question_id' => $question->id,
                        'option_text' => $optionText,
                        'is_correct' => ($data['correct_answer'] == $index),
                    ]);
                }
            } elseif ($questionData['type'] === 'drag_drop' && isset($data['canvas_data'])) {
                $question->options()->delete();
                $canvas = is_string($data['canvas_data']) ? json_decode($data['canvas_data'], true) : $data['canvas_data'];
                if (isset($canvas['items']) && is_array($canvas['items'])) {
                    foreach ($canvas['items'] as $item) {
                        PtQuestionOption::create([
                            'pt_question_id' => $question->id,
                            'option_text' => json_encode($item),
                            'is_correct' => true,
                        ]);
                    }
                }
            } elseif ($questionData['type'] !== 'mcq' && $questionData['type'] !== 'drag_drop') {
                $question->options()->delete();
            }

            return $question;
        });
    }
}
