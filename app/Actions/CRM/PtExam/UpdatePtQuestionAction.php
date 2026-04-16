<?php

namespace App\Actions\Crm\PtExam;

use App\Models\PtQuestion;
use App\Models\PtQuestionOption;
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
                // Simplest is to delete and recreate for this specific structure
                $question->options()->delete();
                foreach ($data['options'] as $index => $optionText) {
                    PtQuestionOption::create([
                        'pt_question_id' => $question->id,
                        'option_text' => $optionText,
                        'is_correct' => ($data['correct_answer'] == $index),
                    ]);
                }
            } elseif ($questionData['type'] !== 'mcq') {
                $question->options()->delete();
            }

            return $question;
        });
    }
}

