<?php

namespace App\Actions\Crm\PtExam;

use App\Models\PtAnswer;
use App\Models\PtSession;
use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SubmitPlacementTestAction
{
    public function handle(PtSession $session, ?array $submittedAnswers): void
    {
        DB::transaction(function () use ($session, $submittedAnswers) {
            $totalScore = 0;
            $hasManualGrading = false;
            $exam = $session->ptExam->load(['questions.options', 'ptQuestionGroups.questions.options']);
            
            // Map questions for efficient lookup 
            $allQuestions = collect();
            foreach ($exam->questions as $q) $allQuestions->push($q);
            foreach ($exam->ptQuestionGroups as $group) {
                foreach ($group->questions as $q) $allQuestions->push($q);
            }
            $questionMap = $allQuestions->keyBy('id');

            $submittedAnswers = $submittedAnswers ?? [];

            foreach ($submittedAnswers as $questionId => $value) {
                // Skip empty or untouched questions
                if ($value === null || $value === '') continue;

                $question = $questionMap->get($questionId);
                if (!$question) continue;

                $answerData = [
                    'pt_session_id' => $session->id,
                    'pt_question_id' => $questionId,
                    'is_correct' => false,
                ];

                if ($question->type === 'mcq') {
                    $selectedOption = $question->options->firstWhere('id', $value);
                    $isCorrect = $selectedOption?->is_correct ?? false;
                    
                    if ($isCorrect) {
                        $totalScore += $question->points;
                    }
                    
                    $answerData['pt_question_option_id'] = $value;
                    $answerData['is_correct'] = $isCorrect;
                } elseif ($question->type === 'text') {
                    $answerData['answer_text'] = $value;
                    $hasManualGrading = true;
                } elseif ($question->type === 'file') {
                    if (request()->hasFile("answers.{$questionId}")) {
                        $file = request()->file("answers.{$questionId}");
                        $path = $file->store("pt_sessions/{$session->id}", 'public');
                        $answerData['file_path'] = $path;
                    }
                    $hasManualGrading = true;
                }

                PtAnswer::create($answerData);
            }

            // Handle Final Work Summary (IELTS specific)
            if (request()->hasFile("summary_file")) {
                $file = request()->file("summary_file");
                $path = $file->store("pt_sessions/{$session->id}/results", 'public');
                $session->result_file_path = $path;
                $hasManualGrading = true;
            }

            // If it's IELTS category, always trigger manual grading
            if ($exam->category === 'IELTS') {
                $hasManualGrading = true;
            }

            $session->status = 'completed';
            $session->finished_at = now();
            $session->final_score = $totalScore;
            $session->is_graded = !$hasManualGrading;
            $session->save();

            // Notify staff
            $superadmins = User::role('superadmin')->get();
            $branchFrontdesk = User::role('frontdesk')
                ->where('branch_id', $session->lead?->branch_id)
                ->get();
            $owner = $session->lead?->owner_id ? User::where('id', $session->lead->owner_id)->get() : collect();

            $recipients = $superadmins->merge($branchFrontdesk)->merge($owner)->unique('id');

            \Illuminate\Support\Facades\Log::info("PT Notification Debug:", [
                'session_id' => $session->id,
                'lead_branch_id' => $session->lead?->branch_id,
                'superadmin_count' => $superadmins->count(),
                'frontdesk_count' => $branchFrontdesk->count(),
                'owner_count' => $owner->count(),
                'total_recipients' => $recipients->count(),
                'recipient_ids' => $recipients->pluck('id')->toArray(),
            ]);

            Notification::send($recipients, new SystemNotification(
                "Placement Test Selesai",
                "Lead {$session->lead?->name} baru saja menyelesaikan placement test {$exam->title}.",
                "success",
                route('admin.placement-tests.index', ['session' => $session->id])
            ));
        });
    }
}

