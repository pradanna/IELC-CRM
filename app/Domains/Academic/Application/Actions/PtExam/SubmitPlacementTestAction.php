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
            $exam = $session->ptExam;
            $category = $exam->category ?? 'General';
            $submittedAnswers = $submittedAnswers ?? [];

            if ($category === 'Kids') {
                // KIDS PLACEMENT TEST SUBMISSION
                $exam->load(['kidsQuestions']);
                $questionMap = $exam->kidsQuestions->keyBy('id');

                foreach ($submittedAnswers as $questionId => $value) {
                    if ($value === null || $value === '') continue;
                    $question = $questionMap->get($questionId);
                    if (!$question) continue;

                    $userMapping = is_array($value) ? $value : json_decode($value, true);
                    $correctTargetsCount = 0;
                    $isAllCorrect = true;
                    $totalTargets = 0;

                    if (is_array($userMapping)) {
                        $canvasData = is_array($question->canvas_data) ? $question->canvas_data : json_decode($question->canvas_data, true);
                        if (isset($canvasData['targets']) && is_array($canvasData['targets'])) {
                            $tokensList = collect($canvasData['tokens'] ?? []);
                            foreach ($canvasData['targets'] as $tgt) {
                                $tgtId = $tgt['id'] ?? '';
                                $tgtType = $tgt['type'] ?? '';
                                if ($tgtId) {
                                    $totalTargets++;
                                    $userAssignedTokenId = $userMapping[$tgtId] ?? null;
                                    $userToken = $tokensList->firstWhere('id', $userAssignedTokenId);

                                    $isTargetCorrect = false;
                                    if ($tgtType === 'ring_target') {
                                        if ($userToken && ($userToken['type'] ?? '') === 'ring') {
                                            $isTargetCorrect = true;
                                        }
                                    } elseif ($tgtType === 'box_target') {
                                        $expectedSymbol = $tgt['correct_symbol'] ?? ($tgt['correct_token_id'] ?? 'check');
                                        $userTokenType = $userToken['type'] ?? '';
                                        if ($userTokenType === $expectedSymbol || ($expectedSymbol === 'check' && $userTokenType === 'check') || ($expectedSymbol === 'cross' && $userTokenType === 'cross')) {
                                            $isTargetCorrect = true;
                                        }
                                    } elseif ($tgtType === 'input_target') {
                                        $expectedText = strtolower(trim((string)($tgt['correct_text'] ?? '')));
                                        $userTypedText = strtolower(trim((string)$userAssignedTokenId));
                                        if ($expectedText !== '' && $userTypedText === $expectedText) {
                                            $isTargetCorrect = true;
                                        }
                                    } elseif ($tgtType === 'word_target') {
                                        $correctTokenId = $tgt['correct_token_id'] ?? '';
                                        if ($userAssignedTokenId === $correctTokenId) {
                                            $isTargetCorrect = true;
                                        }
                                    }

                                    if ($isTargetCorrect) {
                                        $correctTargetsCount += 1;
                                    } else {
                                        $isAllCorrect = false;
                                    }
                                }
                            }
                        } elseif (isset($canvasData['drop_zones']) && is_array($canvasData['drop_zones'])) {
                            foreach ($canvasData['drop_zones'] as $pin) {
                                $pinId = $pin['id'] ?? '';
                                $correctWordId = $pin['correct_word_id'] ?? '';
                                if ($pinId && $correctWordId) {
                                    $totalTargets++;
                                    $userAnswerWord = $userMapping[$pinId] ?? null;
                                    if ($userAnswerWord === $correctWordId) {
                                        $correctTargetsCount += 1;
                                    } else {
                                        $isAllCorrect = false;
                                    }
                                }
                            }
                        }
                    } else {
                        $isAllCorrect = false;
                    }

                    // Nilai dihitung per dropzone yang benar dikalikan bobot poin (points per correct dropzone)
                    $questionPoints = (float)($question->points ?? 1);
                    $earnedScore = $correctTargetsCount * $questionPoints;

                    $isQuestionCorrect = ($totalTargets > 0 && $isAllCorrect);
                    $totalScore += $earnedScore;

                    \App\Domains\Academic\Domain\Models\PtKidsAnswer::create([
                        'pt_session_id' => $session->id,
                        'pt_kids_question_id' => $question->id,
                        'user_mapping' => $userMapping,
                        'is_correct' => $isQuestionCorrect,
                        'score_earned' => $earnedScore,
                    ]);
                }
            } elseif ($category === 'IELTS') {
                // IELTS PLACEMENT TEST SUBMISSION
                $exam->load(['ieltsTasks', 'ieltsTasks']);
                $allTasks = collect();
                foreach ($exam->ieltsTasks as $t) $allTasks->push($t);
                foreach ($exam->ieltsTasks as $s) {
                    foreach ($s->tasks as $t) $allTasks->push($t);
                }
                $taskMap = $allTasks->keyBy('id');
                $hasManualGrading = true;

                foreach ($submittedAnswers as $taskId => $value) {
                    if ($value === null || $value === '') continue;
                    $task = $taskMap->get($taskId);
                    if (!$task) continue;

                    $filePath = null;
                    $essayText = null;

                    if (request()->hasFile("answers.{$taskId}")) {
                        $file = request()->file("answers.{$taskId}");
                        $filePath = $file->store("pt_sessions/{$session->id}/ielts", 'public');
                    } else {
                        $essayText = is_string($value) ? $value : json_encode($value);
                    }

                    \App\Domains\Academic\Domain\Models\PtIeltsAnswer::create([
                        'pt_session_id' => $session->id,
                        'pt_ielts_task_id' => $task->id,
                        'essay_text' => $essayText,
                        'file_path' => $filePath,
                    ]);
                }
            } else {
                // GENERAL PLACEMENT TEST SUBMISSION
                $exam->load(['generalQuestions.options', 'generalGroups.questions.options']);
                $allGeneralQuestions = collect();
                foreach ($exam->generalQuestions as $q) $allGeneralQuestions->push($q);
                foreach ($exam->generalGroups as $group) {
                    foreach ($group->questions as $q) $allGeneralQuestions->push($q);
                }
                
                // Fallback for legacy questions if generalQuestions empty
                if ($allGeneralQuestions->isEmpty()) {
                    $exam->load(['questions.options', 'ptQuestionGroups.questions.options']);
                    foreach ($exam->questions as $q) $allGeneralQuestions->push($q);
                    foreach ($exam->ptQuestionGroups as $group) {
                        foreach ($group->questions as $q) $allGeneralQuestions->push($q);
                    }
                }

                $questionMap = $allGeneralQuestions->keyBy('id');

                foreach ($submittedAnswers as $questionId => $value) {
                    if ($value === null || $value === '') continue;
                    $question = $questionMap->get($questionId);
                    if (!$question) continue;

                    if ($question instanceof \App\Domains\Academic\Domain\Models\PtGeneralQuestion) {
                        $answerData = [
                            'pt_session_id' => $session->id,
                            'pt_general_question_id' => $questionId,
                            'is_correct' => false,
                            'score_earned' => 0,
                        ];

                        if ($question->type === 'mcq') {
                            $selectedOption = $question->options->firstWhere('id', $value);
                            $isCorrect = $selectedOption?->is_correct ?? false;
                            $points = $isCorrect ? $question->points : 0;

                            $totalScore += $points;
                            $answerData['pt_general_question_option_id'] = $value;
                            $answerData['is_correct'] = $isCorrect;
                            $answerData['score_earned'] = $points;
                        } else {
                            $answerData['answer_text'] = is_string($value) ? $value : json_encode($value);
                            $hasManualGrading = true;
                        }

                        \App\Domains\Academic\Domain\Models\PtGeneralAnswer::create($answerData);
                    } else {
                        // Legacy PtAnswer fallback
                        $legacyAnswer = [
                            'pt_session_id' => $session->id,
                            'pt_question_id' => $questionId,
                            'is_correct' => false,
                        ];
                        if ($question->type === 'mcq') {
                            $selectedOption = $question->options->firstWhere('id', $value);
                            $isCorrect = $selectedOption?->is_correct ?? false;
                            if ($isCorrect) $totalScore += $question->points;
                            $legacyAnswer['pt_question_option_id'] = $value;
                            $legacyAnswer['is_correct'] = $isCorrect;
                        } else {
                            $legacyAnswer['answer_text'] = is_string($value) ? $value : json_encode($value);
                            $hasManualGrading = true;
                        }
                        PtAnswer::create($legacyAnswer);
                    }
                }
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
