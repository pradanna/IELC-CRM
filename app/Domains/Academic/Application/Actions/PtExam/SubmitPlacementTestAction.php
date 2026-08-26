<?php

namespace App\Domains\Academic\Application\Actions\PtExam;

use App\Domains\Academic\Domain\Models\PtAnswer;
use App\Domains\Academic\Domain\Models\PtSession;
use App\Domains\Shared\Domain\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
                } elseif ($question->type === 'drag_drop') {
                    // $value is an associative array/object or JSON: { zone_id: [option_id, ...] }
                    $userMapping = is_array($value) ? $value : json_decode($value, true);
                    $answerData['answer_text'] = is_string($value) ? $value : json_encode($value);
                    
                    $isAllCorrect = true;
                    $totalItemsChecked = 0;

                    if (is_array($userMapping)) {
                        foreach ($question->options as $opt) {
                            $itemData = json_decode($opt->option_text, true);
                            $targetZone = $itemData['target_zone'] ?? $itemData['correct_zone'] ?? null;
                            if ($targetZone) {
                                $totalItemsChecked++;
                                $assignedItems = $userMapping[$targetZone] ?? [];
                                if (!in_array($opt->id, $assignedItems) && !in_array($itemData['id'] ?? '', $assignedItems)) {
                                    $isAllCorrect = false;
                                }
                            }
                        }
                    } else {
                        $isAllCorrect = false;
                    }

                    $answerData['is_correct'] = ($totalItemsChecked > 0 && $isAllCorrect);
                    if ($answerData['is_correct']) {
                        $totalScore += $question->points;
                    }
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

            Log::info("PT Notification Debug:", [
                'session_id' => $session->id,
                'lead_branch_id' => $session->lead?->branch_id,
                'superadmin_count' => $superadmins->count(),
                'frontdesk_count' => $branchFrontdesk->count(),
                'owner_count' => $owner->count(),
                'total_recipients' => $recipients->count(),
                'recipient_ids' => $recipients->pluck('id')->toArray(),
            ]);

            $targetLink = $session->lead_id
                ? route('admin.crm.leads.kanban', ['open_lead' => $session->lead_id])
                : route('admin.placement-tests.index', ['session' => $session->id]);

            Notification::send($recipients, new SystemNotification(
                "Placement Test Selesai",
                "Lead {$session->lead?->name} baru saja menyelesaikan placement test {$exam->title}.",
                "success",
                $targetLink
            ));
        });
    }
}
