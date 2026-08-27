<?php

namespace App\Domains\Academic\Application\Actions\PtExam;

use App\Domains\Academic\Domain\Models\PtExam;
use App\Domains\Academic\Domain\Models\PtIeltsTask;
use App\Domains\Academic\Domain\Models\PtQuestion;
use App\Domains\Academic\Domain\Models\PtQuestionOption;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class UpdatePtQuestionAction
{
    public function handle($questionOrId, array $data)
    {
        return DB::transaction(function () use ($questionOrId, $data) {
            $questionId = $questionOrId instanceof PtQuestion || $questionOrId instanceof PtIeltsTask 
                ? $questionOrId->id 
                : $questionOrId;

            // Cek apakah IELTS Task
            $ieltsTask = PtIeltsTask::find($questionId);
            if ($ieltsTask) {
                $taskData = [
                    'skill_type' => $data['skill_type'] ?? $ieltsTask->skill_type,
                    'title' => $data['title'] ?? $data['question_text'] ?? $ieltsTask->title,
                    'description' => $data['description'] ?? $ieltsTask->description,
                    'min_words' => isset($data['min_words']) && $data['min_words'] !== '' ? (int)$data['min_words'] : $ieltsTask->min_words,
                    'duration_minutes' => isset($data['duration_minutes']) && $data['duration_minutes'] !== '' ? (int)$data['duration_minutes'] : $ieltsTask->duration_minutes,
                    'max_score' => $data['max_score'] ?? $data['points'] ?? $ieltsTask->max_score,
                ];

                if (isset($data['audio']) && $data['audio']->isValid()) {
                    if ($ieltsTask->audio_path) Storage::disk('public')->delete($ieltsTask->audio_path);
                    $taskData['audio_path'] = $data['audio']->store('pt_exams/ielts/audio', 'public');
                }
                if (isset($data['question_pdf']) && $data['question_pdf']->isValid()) {
                    if ($ieltsTask->question_pdf_path) Storage::disk('public')->delete($ieltsTask->question_pdf_path);
                    $taskData['question_pdf_path'] = $data['question_pdf']->store('pt_exams/ielts/pdf', 'public');
                }
                if (isset($data['answer_sheet_pdf']) && $data['answer_sheet_pdf']->isValid()) {
                    if ($ieltsTask->answer_sheet_pdf_path) Storage::disk('public')->delete($ieltsTask->answer_sheet_pdf_path);
                    $taskData['answer_sheet_pdf_path'] = $data['answer_sheet_pdf']->store('pt_exams/ielts/pdf', 'public');
                }

                $ieltsTask->update($taskData);
                return $ieltsTask;
            }

            // Default PtQuestion
            $question = PtQuestion::findOrFail($questionId);
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
                if ($canvas) {
                    \App\Domains\Academic\Domain\Models\PtKidCanvas::updateOrCreate(
                        ['pt_question_id' => $question->id],
                        [
                            'mode' => $canvas['mode'] ?? 'freeform_canvas',
                            'instruction' => $canvas['instruction'] ?? null,
                            'canvas_data' => $canvas,
                        ]
                    );
                }
            } elseif ($questionData['type'] !== 'mcq' && $questionData['type'] !== 'drag_drop') {
                $question->options()->delete();
            }

            return $question;
        });
    }
}