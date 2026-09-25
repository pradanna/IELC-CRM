<?php

namespace App\Http\Controllers\Crm\PtExam;

use App\Domains\Academic\Application\Actions\PtExam\SubmitPlacementTestAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Crm\PtExam\SubmitPlacementTestRequest;
use App\Http\Resources\Crm\PtExam\PtExamPublicResource;
use App\Http\Resources\Crm\PtExam\PtSessionResource;
use App\Domains\Academic\Domain\Models\PtAnswer;
use App\Domains\Academic\Domain\Models\PtSession;
use App\Domains\Academic\Application\Services\PtReportService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PublicPlacementTestController extends Controller
{
    public function show(string $token): Response|RedirectResponse
    {
        $session = PtSession::with(['lead', 'ptExam'])
            ->where('token', $token)
            ->firstOrFail();

        if ($session->status === 'completed') {
            return redirect()->route('public.placement-test.result', ['token' => $token]);
        }

        return Inertia::render('Public/PlacementTest/Landing', [
            'session' => [
                'token' => $session->token,
                'status' => $session->status,
                'lead_name' => $session->lead->name ?? 'Student',
            ],
            'exam' => [
                'title' => $session->ptExam->title,
                'description' => $session->ptExam->description,
                'duration_minutes' => $session->ptExam->duration_minutes,
                'slug' => $session->ptExam->slug,
            ]
        ]);
    }

    public function start(string $token): RedirectResponse
    {
        $session = PtSession::where('token', $token)->firstOrFail();

        if ($session->status === 'pending') {
            $session->update([
                'status' => 'in_progress',
                'started_at' => now(),
            ]);
        }

        return redirect()->route('public.placement-test.exam', ['token' => $token]);
    }

    public function exam(string $token): Response|RedirectResponse
    {
        $session = PtSession::with([
            'ptExam.questions.options',
            'ptExam.ptQuestionGroups.questions.options',
            'ptExam.generalQuestions.options',
            'ptExam.generalGroups.questions.options',
            'ptExam.kidsQuestions',
            'ptExam.ieltsTasks',
        ])->where('token', $token)->firstOrFail();

        if ($session->status === 'completed') {
            return redirect()->route('public.placement-test.result', ['token' => $token]);
        }

        $exam = $session->ptExam;

        // Calculate remaining time
        $durationSeconds = $exam->duration_minutes * 60;
        $remainingSeconds = $durationSeconds;

        if ($session->started_at) {
            $elapsed = max(0, now()->timestamp - $session->started_at->timestamp);
            $remainingSeconds = max(0, $durationSeconds - $elapsed);
        }

        return Inertia::render('Public/PlacementTest/Exam', [
            'session' => [
                'token' => $session->token,
                'slug' => $exam->slug,
                'remaining_seconds' => $remainingSeconds,
            ],
            'exam_title' => $exam->title,
            'exam_category' => $exam->category,
            'pages' => (new PtExamPublicResource($exam))->toArray(request())['pages'],
        ]);
    }

    public function submit(SubmitPlacementTestRequest $request, string $token, SubmitPlacementTestAction $action): RedirectResponse
    {
        $session = PtSession::where('token', $token)->firstOrFail();

        if ($session->status !== 'completed') {
            $action->handle($session, $request->validated()['answers'] ?? []);
        }

        return redirect()->route('public.placement-test.result', ['token' => $token]);
    }

    public function result(string $token): Response|RedirectResponse
    {
        $session = PtSession::with([
            'lead',
            'ptExam.generalQuestions',
            'ptExam.generalGroups.questions',
            'ptExam.kidsQuestions',
            'ptExam.ieltsTasks',
            'ptExam.questions',
            'ptExam.ptQuestionGroups.questions',
        ])->where('token', $token)->firstOrFail();

        if ($session->status !== 'completed') {
            return redirect()->route('public.placement-test.show', ['token' => $token]);
        }

        $examResource = new PtExamPublicResource($session->ptExam);
        $totalQuestions = $examResource->toArray(request())['total_questions'] ?? 0;
        if ($totalQuestions <= 0) {
            $totalQuestions = $session->ptExam->questions()->count()
                ?: ($session->ptExam->generalQuestions()->count() ?: 0);
        }
        $category = $session->ptExam->category ?? 'General';

        $correctAnswers = 0;
        $ieltsModules = null;

        if ($category === 'Kids') {
            // Count total evaluatable targets across all canvas questions
            $totalTargets = 0;
            $kidsQuestions = $session->ptExam->kidsQuestions && $session->ptExam->kidsQuestions->isNotEmpty()
                ? $session->ptExam->kidsQuestions
                : $session->ptExam->questions;

            foreach ($kidsQuestions as $q) {
                $rawCanvas = $q->canvas_data ?? $q->kidCanvas?->canvas_data;
                $c = is_string($rawCanvas) ? json_decode($rawCanvas, true) : $rawCanvas;
                if (isset($c['targets']) && is_array($c['targets'])) {
                    $tokensList = collect($c['tokens'] ?? []);
                    $hasRestrictedTokens = $tokensList->contains(fn($t) => !empty($t['allowed_target_ids']) || !empty($t['allowed_target_id']));
                    $allAllowedTargetIds = [];
                    if ($hasRestrictedTokens) {
                        foreach ($tokensList as $t) {
                            if (!empty($t['allowed_target_ids'])) {
                                foreach ($t['allowed_target_ids'] as $tid) {
                                    $allAllowedTargetIds[$tid] = true;
                                }
                            }
                            if (!empty($t['allowed_target_id'])) {
                                $allAllowedTargetIds[$t['allowed_target_id']] = true;
                            }
                        }
                    }

                    $validTargets = array_filter($c['targets'], function ($tgt) use ($hasRestrictedTokens, $allAllowedTargetIds) {
                        $isEx = !empty($tgt['is_example']) || in_array($tgt['type'] ?? '', ['example_circle', 'example_box', 'example_word', 'example_input']);
                        if ($isEx) return false;
                        if (($tgt['type'] ?? '') === 'ring_target' && !filter_var($tgt['is_correct_answer'] ?? true, FILTER_VALIDATE_BOOLEAN)) return false;
                        if (($tgt['type'] ?? '') === 'ring_target' && $hasRestrictedTokens && !isset($allAllowedTargetIds[$tgt['id'] ?? ''])) return false;
                        return true;
                    });
                    $totalTargets += count($validTargets);
                } elseif (isset($c['drop_zones']) && is_array($c['drop_zones'])) {
                    $totalTargets += count($c['drop_zones']);
                }
            }

            if ($totalTargets > 0) {
                $totalQuestions = $totalTargets;
            }

            // Correct answers for kids represents the total targets correctly matched / score points
            $correctAnswers = (int) round($session->final_score ?? 0);
        } elseif ($category === 'IELTS') {
            $session->load(['ptExam.ieltsTasks']);
            $examSlug = $session->ptExam->slug ?? '';
            $isToeflPbt = str_contains($examSlug, 'toefl-pbt');

            $ieltsAnswers = \App\Domains\Academic\Domain\Models\PtIeltsAnswer::with('ptIeltsTask')
                ->where('pt_session_id', $session->id)
                ->get()
                ->keyBy('pt_ielts_task_id');
            
            $ieltsModules = [];
            $rawCorrectTotal = 0;
            $rawQuestionsTotal = 0;

            foreach ($session->ptExam->ieltsTasks->sortBy('position') as $task) {
                $skill = $task->skill_type ?? 'other';
                $taskTitle = strtolower($task->title ?? '');
                $position = (int) ($task->position ?? 1);
                $ans = $ieltsAnswers->get($task->id);

                // Module key resolution: separate Structure from Reading in TOEFL PBT
                $moduleKey = $skill;
                if ($isToeflPbt) {
                    if ($position === 1 || str_contains($taskTitle, 'listening')) {
                        $moduleKey = 'listening';
                    } elseif ($position === 2 || str_contains($taskTitle, 'structure')) {
                        $moduleKey = 'structure';
                    } else {
                        $moduleKey = 'reading';
                    }
                }

                // Parse raw score from teacher notes e.g. "Auto-graded: 32/40 correct (Band 7.5)"
                $rawScore = null;
                if ($ans && $ans->teacher_notes && preg_match('/Auto-graded:\s*(\d+)\/(\d+)/', $ans->teacher_notes, $matches)) {
                    $rawScore = [
                        'correct' => (int)$matches[1],
                        'total' => (int)$matches[2],
                    ];
                }

                // Fallback: evaluate grid if not present in notes
                if ($rawScore === null && $ans && $ans->essay_text) {
                    $payload = json_decode($ans->essay_text, true);
                    $grid = is_array($payload) ? ($payload['grid'] ?? $payload) : [];
                    if (!empty($grid)) {
                        $eval = $isToeflPbt 
                            ? \App\Domains\Academic\Application\Services\ToeflAutoScoringService::gradeTask($examSlug, $task, $grid)
                            : \App\Domains\Academic\Application\Services\IeltsAutoScoringService::gradeTask($examSlug, $task, $grid);
                        if ($eval) {
                            $rawScore = [
                                'correct' => $eval['raw_score'] ?? 0,
                                'total' => $eval['total_questions'] ?? ($isToeflPbt ? ($moduleKey === 'structure' ? 40 : 50) : 40),
                            ];
                        }
                    }
                }

                $isAutoGraded = in_array($skill, ['listening', 'reading']) || $isToeflPbt;
                $bandScore = $ans?->band_score;
                if ($isAutoGraded) {
                    if ($bandScore === null) {
                        $bandScore = $isToeflPbt ? ($moduleKey === 'structure' ? 24 : 27) : 0;
                    }
                    if ($rawScore === null) {
                        $expectedSlots = $isToeflPbt ? ($moduleKey === 'structure' ? 40 : 50) : 40;
                        $rawScore = [
                            'correct' => 0,
                            'total' => $expectedSlots,
                        ];
                    }
                }

                if ($rawScore) {
                    $rawCorrectTotal += $rawScore['correct'];
                    $rawQuestionsTotal += $rawScore['total'];
                }

                $ieltsModules[$moduleKey] = [
                    'title' => $task->title ?? ucfirst($moduleKey),
                    'skill_type' => $moduleKey,
                    'band_score' => $bandScore,
                    'raw_score' => $rawScore,
                    'is_auto_graded' => $isAutoGraded,
                    'has_attempted' => $ans !== null,
                    'status' => $ans?->band_score !== null ? 'graded' : ($ans ? 'pending_review' : ($isAutoGraded ? 'graded' : 'not_attempted')),
                ];
            }

            if ($isToeflPbt) {
                $totalQuestions = $rawQuestionsTotal > 0 ? $rawQuestionsTotal : 140;
                $correctAnswers = $rawCorrectTotal;
            } else {
                $correctAnswers = \App\Domains\Academic\Domain\Models\PtIeltsAnswer::where('pt_session_id', $session->id)->count();
            }
        } else {
            $generalCorrect = \App\Domains\Academic\Domain\Models\PtGeneralAnswer::where('pt_session_id', $session->id)
                ->where('is_correct', true)
                ->count();
            $legacyCorrect = PtAnswer::where('pt_session_id', $session->id)
                ->where('is_correct', true)
                ->count();
            $correctAnswers = $generalCorrect > 0 ? $generalCorrect : $legacyCorrect;
        }

        $percentage = $totalQuestions > 0 ? round(($correctAnswers / $totalQuestions) * 100) : 0;

        return Inertia::render('Public/PlacementTest/Result', [
            'session' => [
                'token' => $session->token,
                'lead_name' => $session->lead->name ?? 'Student',
                'final_score' => $session->final_score,
            ],
            'exam' => [
                'title' => $session->ptExam->title,
                'category' => $session->ptExam->category,
                'slug' => $session->ptExam->slug,
            ],
            'stats' => [
                'total_questions' => $totalQuestions,
                'correct_answers' => $correctAnswers,
                'percentage' => $percentage,
            ],
            'ielts_modules' => $ieltsModules,
            'download_urls' => [
                'result_pdf' => route('public.placement-test.download-result-pdf', ['token' => $token]),
                'answers_pdf' => route('public.placement-test.download-answers-pdf', ['token' => $token]),
            ],
        ]);
    }

    /**
     * Download public candidate achievement and score report as a PDF.
     */
    public function downloadResultPdf(string $token, PtReportService $reportService)
    {
        $session = PtSession::where('token', $token)->firstOrFail();
        $pdf = $reportService->generateResultPdf($session);
        $safeName = \Illuminate\Support\Str::slug($session->lead?->name ?? 'candidate');
        return $pdf->stream("IELC-PT-Achievement-{$safeName}-{$session->id}.pdf");
    }

    /**
     * Download public candidate full question and answers breakdown as a PDF.
     */
    public function downloadAnswersPdf(string $token, PtReportService $reportService)
    {
        $session = PtSession::where('token', $token)->firstOrFail();
        $pdf = $reportService->generateAnswersPdf($session);
        $safeName = \Illuminate\Support\Str::slug($session->lead?->name ?? 'candidate');
        return $pdf->stream("IELC-PT-Answers-{$safeName}-{$session->id}.pdf");
    }
}



