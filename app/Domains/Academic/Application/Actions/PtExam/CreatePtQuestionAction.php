<?php

namespace App\Domains\Academic\Application\Actions\PtExam;

use App\Domains\Academic\Domain\Models\PtExam;
use App\Domains\Academic\Domain\Models\PtIeltsTask;
use App\Domains\Academic\Domain\Models\PtQuestion;
use App\Domains\Academic\Domain\Models\PtQuestionOption;
use Illuminate\Support\Facades\DB;

class CreatePtQuestionAction
{
    public function handle(array $data)
    {
        return DB::transaction(function () use ($data) {
            $exam = PtExam::find($data['pt_exam_id']);

            // Jika Exam adalah IELTS, simpan langsung ke tabel pt_ielts_tasks
            if ($exam && $exam->category === 'IELTS') {
                $taskData = [
                    'pt_exam_id' => $data['pt_exam_id'],
                    'skill_type' => $data['skill_type'] ?? 'writing',
                    'title' => $data['title'] ?? $data['question_text'],
                    'description' => $data['description'] ?? null,
                    'min_words' => isset($data['min_words']) && $data['min_words'] !== '' ? (int)$data['min_words'] : null,
                    'duration_minutes' => isset($data['duration_minutes']) && $data['duration_minutes'] !== '' ? (int)$data['duration_minutes'] : null,
                    'max_score' => $data['max_score'] ?? $data['points'] ?? 9.0,
                    'position' => PtIeltsTask::where('pt_exam_id', $data['pt_exam_id'])->count() + 1,
                ];

                if (isset($data['audio']) && $data['audio']->isValid()) {
                    $taskData['audio_path'] = $data['audio']->store('pt_exams/ielts/audio', 'public');
                }
                if (isset($data['question_pdf']) && $data['question_pdf']->isValid()) {
                    $taskData['question_pdf_path'] = $data['question_pdf']->store('pt_exams/ielts/pdf', 'public');
                }
                if (isset($data['answer_sheet_pdf']) && $data['answer_sheet_pdf']->isValid()) {
                    $taskData['answer_sheet_pdf_path'] = $data['answer_sheet_pdf']->store('pt_exams/ielts/pdf', 'public');
                }

                return PtIeltsTask::create($taskData);
            }

            // Default General / Kids Question
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
                $canvas = is_string($data['canvas_data']) ? json_decode($data['canvas_data'], true) : $data['canvas_data'];
                if ($canvas) {
                    \App\Domains\Academic\Domain\Models\PtKidCanvas::create([
                        'pt_question_id' => $question->id,
                        'mode' => $canvas['mode'] ?? 'freeform_canvas',
                        'instruction' => $canvas['instruction'] ?? null,
                        'canvas_data' => $canvas,
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