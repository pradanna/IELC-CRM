<?php

namespace App\Domains\Academic\Application\Services;

use App\Domains\Academic\Application\Actions\PtExam\SubmitPlacementTestAction;
use App\Domains\Academic\Domain\Models\PtGeneralAnswer;
use App\Domains\Academic\Domain\Models\PtSession;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;

class PtReportService
{
    /**
     * Build comprehensive report and answers data for any placement test session.
     */
    public function getReportData(PtSession $session): array
    {
        $session->loadMissing([
            'lead.branch',
            'ptExam.questions.kidCanvas',
            'ptExam.kidsQuestions',
            'ptExam.generalQuestions.options',
            'ptExam.generalGroups.questions.options',
            'ptExam.ieltsTasks',
            'kidCanvasAnswers',
            'kidsAnswers',
            'generalAnswers',
            'ieltsAnswers.ptIeltsTask',
            'answers',
        ]);

        $exam = $session->ptExam;
        $category = $exam->category ?? 'General';
        $lead = $session->lead;

        $candidateName = $lead?->name ?? 'Candidate';
        $branchName = $lead?->branch?->name ?? 'IELC';
        $testDate = $session->completed_at 
            ? Carbon::parse($session->completed_at)->translatedFormat('d F Y, H:i') 
            : ($session->created_at ? Carbon::parse($session->created_at)->translatedFormat('d F Y, H:i') : '-');

        if ($category === 'Kids') {
            return $this->buildKidsReportData($session, $exam, $candidateName, $branchName, $testDate);
        } elseif ($category === 'IELTS') {
            return $this->buildIeltsReportData($session, $exam, $candidateName, $branchName, $testDate);
        } else {
            return $this->buildGeneralReportData($session, $exam, $candidateName, $branchName, $testDate);
        }
    }

    /**
     * Build report data for Kids Placement Test (Canvas-based).
     */
    protected function buildKidsReportData(PtSession $session, $exam, string $candidateName, string $branchName, string $testDate): array
    {
        $isKidsQuestionsTable = $exam->kidsQuestions && $exam->kidsQuestions->isNotEmpty();
        $questions = $isKidsQuestionsTable 
            ? $exam->kidsQuestions->sortBy('order')->values() 
            : ($exam->questions ?? collect())->sortBy('position')->values();

        $answers = $isKidsQuestionsTable 
            ? $session->kidsAnswers->keyBy('pt_kids_question_id')
            : $session->kidCanvasAnswers->keyBy('pt_question_id');

        $reportQuestions = [];
        $totalTargetsAll = 0;
        $totalCorrectTargetsAll = 0;

        foreach ($questions as $idx => $q) {
            $rawCanvas = $q->canvas_data ?? $q->kidCanvas?->canvas_data;
            $c = is_string($rawCanvas) ? json_decode($rawCanvas, true) : $rawCanvas;
            if (!is_array($c)) {
                $c = [];
            }

            $ans = $answers->get($q->id);
            $userMapping = $ans?->user_mapping ?? [];
            if (is_string($userMapping)) {
                $userMapping = json_decode($userMapping, true) ?? [];
            }
            if (!is_array($userMapping)) {
                $userMapping = [];
            }

            $tokensList = collect($c['tokens'] ?? []);
            $tokensById = $tokensList->keyBy('id');

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

            $validTargets = [];
            if (isset($c['targets']) && is_array($c['targets'])) {
                foreach ($c['targets'] as $tgt) {
                    $isEx = !empty($tgt['is_example']) || in_array($tgt['type'] ?? '', ['example_circle', 'example_box', 'example_word', 'example_input']);
                    if ($isEx) continue;
                    if (($tgt['type'] ?? '') === 'ring_target' && !filter_var($tgt['is_correct_answer'] ?? true, FILTER_VALIDATE_BOOLEAN)) continue;
                    if (($tgt['type'] ?? '') === 'ring_target' && $hasRestrictedTokens && !isset($allAllowedTargetIds[$tgt['id'] ?? ''])) continue;
                    $validTargets[] = $tgt;
                }
            } elseif (isset($c['drop_zones']) && is_array($c['drop_zones'])) {
                $validTargets = $c['drop_zones'];
            }

            $targetsDetail = [];
            $correctCount = 0;

            foreach ($validTargets as $tIdx => $tgt) {
                $tgtId = $tgt['id'] ?? '';
                $userVal = $userMapping[$tgtId] ?? null;
                $userToken = $tokensById->get($userVal);
                $tgtType = $tgt['type'] ?? '';

                $isTargetCorrect = false;
                $expectedAnswerStr = '';
                $userAnswerStr = 'Tidak dijawab';

                if ($tgtType === 'ring_target') {
                    $isTargetExpected = isset($tgt['is_correct_answer'])
                        ? filter_var($tgt['is_correct_answer'], FILTER_VALIDATE_BOOLEAN)
                        : true;
                    $expectedAnswerStr = 'Melingkari Objek';
                    if ($userToken && ($userToken['type'] ?? '') === 'ring') {
                        $userAnswerStr = 'Melingkari Objek';
                        if ($isTargetExpected) {
                            $isTargetCorrect = true;
                        }
                    }
                } elseif ($tgtType === 'box_target') {
                    $expectedSymbol = $tgt['correct_symbol'] ?? null;
                    $expectedTokenId = $tgt['correct_token_id'] ?? null;
                    $expToken = $tokensById->get($expectedTokenId);

                    if ($expectedSymbol === 'check') $expectedAnswerStr = '✓ (Centang)';
                    elseif ($expectedSymbol === 'cross') $expectedAnswerStr = '✗ (Silang)';
                    elseif ($expToken) $expectedAnswerStr = $expToken['text'] ?? $expToken['label'] ?? $expToken['word'] ?? 'Gambar/Simbol';
                    else $expectedAnswerStr = $expectedTokenId ?? '-';

                    if ($userToken) {
                        $uType = $userToken['type'] ?? '';
                        if ($uType === 'check') $userAnswerStr = '✓ (Centang)';
                        elseif ($uType === 'cross') $userAnswerStr = '✗ (Silang)';
                        else $userAnswerStr = $userToken['text'] ?? $userToken['label'] ?? $userToken['word'] ?? $uType;
                    } elseif ($userVal) {
                        if ($userVal === 'check') $userAnswerStr = '✓ (Centang)';
                        elseif ($userVal === 'cross') $userAnswerStr = '✗ (Silang)';
                        else $userAnswerStr = (string)$userVal;
                    }

                    if ($expectedTokenId && $userVal === $expectedTokenId) {
                        $isTargetCorrect = true;
                    } elseif ($expectedSymbol) {
                        $uType = $userToken['type'] ?? ($userVal ?? '');
                        if ($uType === $expectedSymbol) {
                            $isTargetCorrect = true;
                        }
                    } elseif ($expectedTokenId && (($userToken['type'] ?? '') === $expectedTokenId)) {
                        $isTargetCorrect = true;
                    }
                } elseif ($tgtType === 'input_target') {
                    $expectedRaw = (string)($tgt['correct_text'] ?: ($tgt['label'] ?? ''));
                    $expectedAnswerStr = $expectedRaw;
                    if ($userVal !== null && $userVal !== '') {
                        $userAnswerStr = (string)$userVal;
                        if (SubmitPlacementTestAction::isTextOrNumberMatch($userAnswerStr, $expectedRaw)) {
                            $isTargetCorrect = true;
                        }
                    }
                } elseif ($tgtType === 'word_target') {
                    $correctTokenId = $tgt['correct_token_id'] ?? '';
                    $expToken = $tokensById->get($correctTokenId);
                    $expectedAnswerStr = $expToken['text'] ?? $expToken['label'] ?? $expToken['word'] ?? $correctTokenId;

                    if ($userToken) {
                        $userAnswerStr = $userToken['text'] ?? $userToken['label'] ?? $userToken['word'] ?? $userToken['id'];
                    } elseif ($userVal) {
                        $userAnswerStr = (string)$userVal;
                    }

                    if ($userVal === $correctTokenId) {
                        $isTargetCorrect = true;
                    }
                } elseif (isset($tgt['correct_word_id'])) {
                    $expectedAnswerStr = $tgt['correct_word_id'];
                    if ($userVal !== null && $userVal !== '') {
                        $userAnswerStr = (string)$userVal;
                        if ($userVal === $tgt['correct_word_id']) {
                            $isTargetCorrect = true;
                        }
                    }
                }

                if ($isTargetCorrect) {
                    $correctCount++;
                }

                $cleanLabel = trim($tgt['label'] ?? '');
                if (empty($cleanLabel) || preg_match('/^\.+$/', $cleanLabel)) {
                    $displayLabel = 'Kotak #' . ($tIdx + 1);
                } else {
                    $displayLabel = $cleanLabel;
                }

                $targetsDetail[] = [
                    'target_num' => $tIdx + 1,
                    'label' => $displayLabel,
                    'type' => $tgtType,
                    'expected' => $expectedAnswerStr,
                    'user_answer' => $userAnswerStr,
                    'is_correct' => $isTargetCorrect,
                ];
            }

            $qCount = count($validTargets);
            $totalTargetsAll += $qCount;
            $totalCorrectTargetsAll += $correctCount;

            $instruction = $q->instruction ?? $q->kidCanvas?->instruction ?? $q->question_text ?? ("Soal " . ($idx + 1));

            $reportQuestions[] = [
                'number' => $idx + 1,
                'id' => $q->id,
                'instruction' => $instruction,
                'total_targets' => $qCount,
                'correct_targets' => $correctCount,
                'is_perfect' => ($qCount > 0 && $correctCount === $qCount),
                'status_label' => ($qCount > 0 && $correctCount === $qCount) ? 'BENAR' : ($correctCount > 0 ? 'SEBAGIAN BENAR' : 'SALAH'),
                'targets' => $targetsDetail,
            ];
        }

        $percentage = $totalTargetsAll > 0 ? round(($totalCorrectTargetsAll / $totalTargetsAll) * 100, 1) : 0;

        return [
            'session' => $session,
            'exam' => $exam,
            'candidate_name' => $candidateName,
            'branch_name' => $branchName,
            'test_date' => $testDate,
            'category' => 'Kids',
            'unit_label' => 'Kotak Isian',
            'total_questions' => $totalTargetsAll,
            'total_targets' => $totalTargetsAll,
            'correct_answers' => $totalCorrectTargetsAll,
            'correct_targets' => $totalCorrectTargetsAll,
            'percentage' => $percentage,
            'final_score' => $session->final_score ?? $totalCorrectTargetsAll,
            'recommended_level' => $session->recommended_level ?? $this->suggestKidsLevel($percentage),
            'achievement_text' => "Benar {$totalCorrectTargetsAll} dari {$totalTargetsAll} Soal (Kotak Isian)",
            'grading_notes' => $session->grading_notes,
            'questions' => $reportQuestions,
        ];
    }

    /**
     * Build report data for General Placement Test.
     */
    protected function buildGeneralReportData(PtSession $session, $exam, string $candidateName, string $branchName, string $testDate): array
    {
        $generalAnswers = $session->generalAnswers->keyBy('pt_general_question_id');
        $legacyAnswers = $session->answers->keyBy('pt_question_id');

        $questionsList = collect();
        if ($exam->relationLoaded('generalQuestions') && $exam->generalQuestions->isNotEmpty()) {
            $questionsList = $exam->generalQuestions->sortBy('position')->values();
        } elseif ($exam->questions->isNotEmpty()) {
            $questionsList = $exam->questions->sortBy('position')->values();
        }

        $reportQuestions = [];
        $totalCorrect = 0;
        $totalCount = 0;

        foreach ($questionsList as $idx => $q) {
            $ans = $generalAnswers->get($q->id) ?? $legacyAnswers->get($q->id);
            $totalCount++;

            $isCorrect = (bool)($ans?->is_correct ?? false);
            if ($isCorrect) {
                $totalCorrect++;
            }

            $userAnswerText = $ans?->answer_text;
            $selectedOpt = null;
            if ($ans?->option_id && $q->relationLoaded('options')) {
                $selectedOpt = $q->options->firstWhere('id', $ans->option_id);
            }
            if ($selectedOpt) {
                $userAnswerText = $selectedOpt->option_text ?? $selectedOpt->text;
            }

            $correctOpt = $q->relationLoaded('options') ? $q->options->firstWhere('is_correct', true) : null;
            $expectedText = $correctOpt ? ($correctOpt->option_text ?? $correctOpt->text) : '-';

            $reportQuestions[] = [
                'number' => $idx + 1,
                'id' => $q->id,
                'instruction' => $q->question_text ?? ('Soal #' . ($idx + 1)),
                'total_targets' => 1,
                'correct_targets' => $isCorrect ? 1 : 0,
                'is_perfect' => $isCorrect,
                'status_label' => $isCorrect ? 'BENAR' : 'SALAH',
                'targets' => [[
                    'target_num' => 1,
                    'label' => 'Jawaban',
                    'type' => 'choice',
                    'expected' => $expectedText,
                    'user_answer' => $userAnswerText ?: 'Tidak dijawab',
                    'is_correct' => $isCorrect,
                ]],
            ];
        }

        $percentage = $totalCount > 0 ? round(($totalCorrect / $totalCount) * 100, 1) : 0;

        return [
            'session' => $session,
            'exam' => $exam,
            'candidate_name' => $candidateName,
            'branch_name' => $branchName,
            'test_date' => $testDate,
            'category' => 'General',
            'unit_label' => 'Soal',
            'total_questions' => $totalCount,
            'total_targets' => $totalCount,
            'correct_answers' => $totalCorrect,
            'correct_targets' => $totalCorrect,
            'percentage' => $percentage,
            'final_score' => $session->final_score ?? $totalCorrect,
            'recommended_level' => $session->recommended_level ?? $this->suggestGeneralLevel($percentage),
            'achievement_text' => "Benar {$totalCorrect} dari {$totalCount} Soal",
            'grading_notes' => $session->grading_notes,
            'questions' => $reportQuestions,
        ];
    }

    /**
     * Build report data for IELTS Placement Test.
     */
    protected function buildIeltsReportData(PtSession $session, $exam, string $candidateName, string $branchName, string $testDate): array
    {
        $ieltsTasks = $exam->ieltsTasks?->sortBy('position') ?? collect();
        $ieltsAnswers = $session->ieltsAnswers->keyBy('pt_ielts_task_id');

        $modules = [];
        $listeningRaw = null;
        $readingRaw = null;
        $listeningBand = null;
        $readingBand = null;
        $writingBand = null;
        $speakingBand = null;

        foreach ($ieltsTasks as $task) {
            $ans = $ieltsAnswers->get($task->id);
            $skill = $task->skill_type ?? 'other';
            $parsedPayload = $ans && is_string($ans->essay_text) ? json_decode($ans->essay_text, true) : null;
            $grid = is_array($parsedPayload) ? ($parsedPayload['grid'] ?? $parsedPayload) : [];

            $eval = null;
            if ($skill === 'listening') {
                if (!empty($grid)) {
                    $eval = IeltsAutoScoringService::gradeListening($grid);
                    $listeningRaw = $eval['raw_score'] ?? null;
                    $listeningBand = $ans?->band_score ?? ($eval['band_score'] ?? null);
                } else {
                    $listeningRaw = $ans?->teacher_notes && preg_match('/Auto-graded:\s*(\d+)\/(\d+)/', $ans->teacher_notes, $m)
                        ? ['correct' => (int)$m[1], 'total' => (int)$m[2]]
                        : ['correct' => 0, 'total' => 40];
                    $listeningBand = $ans?->band_score ?? 0;
                }
            } elseif ($skill === 'reading') {
                if (!empty($grid)) {
                    $eval = IeltsAutoScoringService::gradeReading($grid);
                    $readingRaw = $eval['raw_score'] ?? null;
                    $readingBand = $ans?->band_score ?? ($eval['band_score'] ?? null);
                } else {
                    $readingRaw = $ans?->teacher_notes && preg_match('/Auto-graded:\s*(\d+)\/(\d+)/', $ans->teacher_notes, $m)
                        ? ['correct' => (int)$m[1], 'total' => (int)$m[2]]
                        : ['correct' => 0, 'total' => 40];
                    $readingBand = $ans?->band_score ?? 0;
                }
            } elseif ($skill === 'writing') {
                $writingBand = $ans?->band_score;
            } elseif ($skill === 'speaking') {
                $speakingBand = $ans?->band_score;
            }

            $isAutoGraded = in_array($skill, ['listening', 'reading']);
            $finalBand = $ans?->band_score ?? ($eval['band_score'] ?? ($isAutoGraded ? 0 : null));
            $finalRaw = $eval['raw_score'] ?? ($isAutoGraded ? ($skill === 'listening' ? $listeningRaw : $readingRaw) : null);

            $modules[$skill] = [
                'task' => $task,
                'skill' => $skill,
                'title' => $task->title ?? ucfirst($skill),
                'band_score' => $finalBand,
                'raw_score' => $finalRaw,
                'answer' => $ans,
            ];
        }

        return [
            'session' => $session,
            'exam' => $exam,
            'candidate_name' => $candidateName,
            'branch_name' => $branchName,
            'test_date' => $testDate,
            'category' => 'IELTS',
            'unit_label' => 'Tasks',
            'total_questions' => count($ieltsTasks),
            'total_targets' => count($ieltsTasks),
            'correct_answers' => count($ieltsAnswers),
            'correct_targets' => count($ieltsAnswers),
            'percentage' => null,
            'final_score' => $session->final_score,
            'recommended_level' => $session->recommended_level,
            'achievement_text' => "Overall Band: " . ($session->final_score ?? '-'),
            'grading_notes' => $session->grading_notes,
            'modules' => $modules,
            'questions' => [],
        ];
    }

    /**
     * Helper to suggest Kids Level based on percentage.
     */
    protected function suggestKidsLevel(float $pct): string
    {
        if ($pct >= 85) return 'Flyers (Level 3 - Advanced Kids)';
        if ($pct >= 65) return 'Movers (Level 2 - Intermediate Kids)';
        if ($pct >= 40) return 'Starters (Level 1 - Elementary Kids)';
        return 'Pre-Starters (Foundation Kids)';
    }

    /**
     * Helper to suggest General Level based on percentage.
     */
    protected function suggestGeneralLevel(float $pct): string
    {
        if ($pct >= 85) return 'Upper Intermediate / Advanced (B2 - C1)';
        if ($pct >= 70) return 'Intermediate (B1)';
        if ($pct >= 50) return 'Pre-Intermediate (A2)';
        return 'Elementary / Beginner (A1)';
    }

    /**
     * Render the Achievement / Score Report PDF.
     */
    public function generateResultPdf(PtSession $session)
    {
        $data = $this->getReportData($session);
        return Pdf::loadView('pdf.pt_achievement_result', $data);
    }

    /**
     * Render the Student Answer Sheet PDF.
     */
    public function generateAnswersPdf(PtSession $session)
    {
        $data = $this->getReportData($session);
        return Pdf::loadView('pdf.pt_student_answers', $data);
    }
}
