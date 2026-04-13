<?php

namespace App\Actions\CRM\PtExam;

use App\Models\PtSession;
use App\Models\PtAnswer;
use Illuminate\Support\Facades\DB;

class SubmitPlacementTestAction
{
    public function handle(PtSession $session, array $submittedAnswers): void
    {
        DB::transaction(function () use ($session, $submittedAnswers) {
            $totalScore = 0;
            $exam = $session->ptExam->load(['questions.options', 'ptQuestionGroups.questions.options']);
            
            // Map questions for efficient lookup from eager loaded relationships
            $allQuestions = collect();
            foreach ($exam->questions as $q) $allQuestions->push($q);
            foreach ($exam->ptQuestionGroups as $group) {
                foreach ($group->questions as $q) $allQuestions->push($q);
            }
            $questionMap = $allQuestions->keyBy('id');

            foreach ($submittedAnswers as $questionId => $optionId) {
                $question = $questionMap->get($questionId);
                if (!$question) continue;

                $selectedOption = $question->options->firstWhere('id', $optionId);
                $isCorrect = $selectedOption?->is_correct ?? false;

                if ($isCorrect) {
                    $totalScore += $question->points;
                }

                PtAnswer::create([
                    'pt_session_id' => $session->id,
                    'pt_question_id' => $questionId,
                    'pt_question_option_id' => $optionId,
                    'is_correct' => $isCorrect,
                ]);
            }

            $session->status = 'completed';
            $session->finished_at = now();
            $session->final_score = $totalScore;
            $session->save();
        });
    }
}
