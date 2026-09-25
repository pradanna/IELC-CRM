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
                // Support both new PtKidsQuestion model and legacy PtQuestion + PtKidCanvas model
                $exam->load(['kidsQuestions', 'questions.kidCanvas']);
                
                $isKidsQuestionsTable = $exam->kidsQuestions && $exam->kidsQuestions->isNotEmpty();
                $questionMap = $isKidsQuestionsTable
                    ? $exam->kidsQuestions->keyBy('id')
                    : ($exam->questions ?? collect())->keyBy('id');

                foreach ($submittedAnswers as $questionId => $value) {
                    if ($value === null || $value === '') continue;
                    $question = $questionMap->get($questionId);
                    if (!$question) continue;

                    $userMapping = is_array($value) ? $value : json_decode($value, true);
                    $correctTargetsCount = 0;
                    $isAllCorrect = true;
                    $totalTargets = 0;

                    if (is_array($userMapping)) {
                        $rawCanvas = $question->canvas_data ?? $question->kidCanvas?->canvas_data;
                        $canvasData = is_array($rawCanvas) ? $rawCanvas : json_decode($rawCanvas, true);

                        if (isset($canvasData['targets']) && is_array($canvasData['targets'])) {
                            $tokensList = collect($canvasData['tokens'] ?? []);
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

                            foreach ($canvasData['targets'] as $tgt) {
                                $tgtId = $tgt['id'] ?? '';
                                $tgtType = $tgt['type'] ?? '';
                                $isExample = !empty($tgt['is_example']) || in_array($tgtType, ['example_circle', 'example_box', 'example_word', 'example_input']);
                                
                                // Target contoh tidak dihitung dalam penilaian sama sekali
                                if ($isExample) {
                                    continue;
                                }

                                // Target ring yang tidak ada dalam daftar token mana pun (misal pengecoh di header contoh yang belum tertandai)
                                if ($tgtType === 'ring_target' && $hasRestrictedTokens && !isset($allAllowedTargetIds[$tgtId])) {
                                    continue;
                                }

                                // Target pengecoh (is_correct_answer === false / '0' / 0 / 'false')
                                $isTargetExpected = isset($tgt['is_correct_answer'])
                                    ? filter_var($tgt['is_correct_answer'], FILTER_VALIDATE_BOOLEAN)
                                    : true;

                                if ($tgtType === 'ring_target' && !$isTargetExpected) {
                                    // Jika siswa melingkari target pengecoh, maka jawaban salah
                                    $userAssignedTokenId = $userMapping[$tgtId] ?? null;
                                    if (!empty($userAssignedTokenId)) {
                                        $isAllCorrect = false;
                                    }
                                    continue;
                                }

                                if ($tgtId) {
                                    $totalTargets++;
                                    $userAssignedTokenId = $userMapping[$tgtId] ?? null;
                                    $userToken = $tokensList->firstWhere('id', $userAssignedTokenId);

                                    $isTargetCorrect = false;
                                    if ($tgtType === 'ring_target') {
                                        if ($userToken && ($userToken['type'] ?? '') === 'ring' && $isTargetExpected) {
                                            $isTargetCorrect = true;
                                        }
                                    } elseif ($tgtType === 'box_target') {
                                        $expectedSymbol = $tgt['correct_symbol'] ?? null;
                                        $expectedTokenId = $tgt['correct_token_id'] ?? null;
                                        $userTokenType = $userToken['type'] ?? '';

                                        // If box target is set with an image token (or token ID match)
                                        if ($expectedTokenId && $userAssignedTokenId === $expectedTokenId) {
                                            $isTargetCorrect = true;
                                        } elseif ($expectedSymbol) {
                                            if ($userTokenType === $expectedSymbol || ($expectedSymbol === 'check' && $userTokenType === 'check') || ($expectedSymbol === 'cross' && $userTokenType === 'cross')) {
                                                $isTargetCorrect = true;
                                            }
                                        } elseif ($expectedTokenId && ($userTokenType === $expectedTokenId || ($expectedTokenId === 'check' && $userTokenType === 'check') || ($expectedTokenId === 'cross' && $userTokenType === 'cross'))) {
                                            $isTargetCorrect = true;
                                        }
                                    } elseif ($tgtType === 'input_target') {
                                        $expectedRaw = (string)($tgt['correct_text'] ?: ($tgt['label'] ?? ''));
                                        $userTypedText = (string)$userAssignedTokenId;
                                        if (self::isTextOrNumberMatch($userTypedText, $expectedRaw)) {
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

                    // Nilai dihitung per target yang benar dikalikan bobot poin (points per correct target/dropzone)
                    $questionPoints = (float)($question->points ?? 1);
                    $earnedScore = $correctTargetsCount * $questionPoints;

                    $isQuestionCorrect = ($totalTargets > 0 && $isAllCorrect);
                    $totalScore += $earnedScore;

                    if ($isKidsQuestionsTable) {
                        \App\Domains\Academic\Domain\Models\PtKidsAnswer::create([
                            'pt_session_id' => $session->id,
                            'pt_kids_question_id' => $question->id,
                            'user_mapping' => $userMapping,
                            'is_correct' => $isQuestionCorrect,
                            'score_earned' => $earnedScore,
                        ]);
                    } else {
                        \App\Domains\Academic\Domain\Models\PtKidCanvasAnswer::create([
                            'pt_session_id' => $session->id,
                            'pt_question_id' => $question->id,
                            'pt_kid_canvas_id' => $question->kidCanvas?->id,
                            'user_mapping' => $userMapping,
                            'is_correct' => $isQuestionCorrect,
                        ]);
                    }
                }
            } elseif ($category === 'IELTS') {
                // IELTS PLACEMENT TEST SUBMISSION
                $exam->load(['ieltsTasks']);
                $taskMap = $exam->ieltsTasks->keyBy('id');
                $hasManualGrading = true; // Writing and Speaking still require consultant/teacher evaluation

                foreach ($submittedAnswers as $taskId => $value) {
                    if ($value === null || $value === '') continue;
                    $task = $taskMap->get($taskId);
                    if (!$task) continue;

                    $filePath = null;
                    $essayText = null;
                    $bandScore = null;
                    $teacherNotes = null;

                    if (request()->hasFile("answers.{$taskId}")) {
                        $file = request()->file("answers.{$taskId}");
                        $filePath = $file->store("pt_sessions/{$session->id}/ielts", 'public');
                    } else {
                        $essayText = is_string($value) ? $value : json_encode($value);
                    }

                    // Auto-scoring for objective tasks (Reading, Listening, Structure)
                    $parsedAnswers = is_array($value) ? $value : (is_string($value) ? json_decode($value, true) : null);
                    $gridAnswers = is_array($parsedAnswers) ? ($parsedAnswers['grid'] ?? $parsedAnswers) : [];

                    $gradeResult = null;
                    if (str_contains($exam->slug, 'toefl')) {
                        $gradeResult = \App\Domains\Academic\Application\Services\ToeflAutoScoringService::gradeTask($exam->slug, $task, $gridAnswers);
                    } else {
                        $gradeResult = \App\Domains\Academic\Application\Services\IeltsAutoScoringService::gradeTask($exam->slug, $task, $gridAnswers);
                    }

                    if ($gradeResult && is_array($gridAnswers) && !empty($gridAnswers)) {
                        $bandScore = $gradeResult['band_score'] ?? ($gradeResult['scaled_score'] ?? null);
                        $totalScore += $gradeResult['raw_score'];
                        $scoreLabel = str_contains($exam->slug, 'toefl') ? 'Scaled' : 'Band';
                        $teacherNotes = "Auto-graded: {$gradeResult['raw_score']}/{$gradeResult['total_questions']} correct ({$scoreLabel} {$bandScore})";
                    }

                    \App\Domains\Academic\Domain\Models\PtIeltsAnswer::create([
                        'pt_session_id' => $session->id,
                        'pt_ielts_task_id' => $task->id,
                        'essay_text' => $essayText,
                        'answer_file_path' => $filePath,
                        'band_score' => $bandScore,
                        'teacher_notes' => $teacherNotes,
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

    protected static array $numberUnits = [
        0 => 'zero', 1 => 'one', 2 => 'two', 3 => 'three', 4 => 'four',
        5 => 'five', 6 => 'six', 7 => 'seven', 8 => 'eight', 9 => 'nine',
        10 => 'ten', 11 => 'eleven', 12 => 'twelve', 13 => 'thirteen',
        14 => 'fourteen', 15 => 'fifteen', 16 => 'sixteen', 17 => 'seventeen',
        18 => 'eighteen', 19 => 'nineteen',
    ];

    protected static array $numberTens = [
        20 => 'twenty', 30 => 'thirty', 40 => 'forty', 50 => 'fifty',
        60 => 'sixty', 70 => 'seventy', 80 => 'eighty', 90 => 'ninety',
    ];

    public static function numberToWords(int $num): array
    {
        if (isset(self::$numberUnits[$num])) return [self::$numberUnits[$num]];
        if (isset(self::$numberTens[$num])) return [self::$numberTens[$num]];
        if ($num > 20 && $num < 100) {
            $t = (int)(floor($num / 10) * 10);
            $u = $num % 10;
            $tenWord = self::$numberTens[$t] ?? '';
            $unitWord = self::$numberUnits[$u] ?? '';
            if ($tenWord && $unitWord) {
                return ["{$tenWord}-{$unitWord}", "{$tenWord} {$unitWord}"];
            }
        }
        if ($num === 100) return ['one hundred', 'hundred'];
        return [];
    }

    public static function wordsToNumber(string $str): ?int
    {
        $clean = trim(str_replace('-', ' ', strtolower($str)));
        if ($clean === '') return null;

        $unitFlip = array_flip(self::$numberUnits);
        $tenFlip = array_flip(self::$numberTens);

        if (isset($unitFlip[$clean])) return $unitFlip[$clean];
        if (isset($tenFlip[$clean])) return $tenFlip[$clean];
        if ($clean === 'one hundred' || $clean === 'hundred') return 100;

        $parts = explode(' ', $clean);
        if (count($parts) === 2 && isset($tenFlip[$parts[0]]) && isset($unitFlip[$parts[1]])) {
            return $tenFlip[$parts[0]] + $unitFlip[$parts[1]];
        }

        return null;
    }

    public static function normalizeAnswer(string $str): string
    {
        $s = strtolower(trim($str));
        $s = str_replace(['.', ':'], ':', $s);
        $s = str_replace(['-', '&'], [' ', 'and'], $s);
        $s = preg_replace('/\s+/', ' ', $s);
        return trim($s);
    }

    /**
     * Check if user answer matches the expected answer, supporting:
     * 1. Multiple options separated by `/`, `,` or `|` (e.g. "12 / twelve")
     * 2. Full numbers 0 - 100 digits and words (e.g. "22" <=> "twenty-two", "64" <=> "sixty four")
     * 3. Numbers inside phrases (e.g. "two days" <=> "2 days")
     * 4. Punctuation, symbols, and time formats (e.g. "2.30" <=> "2:30")
     * 5. Spacing variations (e.g. "stomachache" <=> "stomach ache", "no-one in" <=> "no one in")
     * 6. Minor typo tolerance on longer words (e.g. "Russell" <=> "russel")
     */
    public static function isTextOrNumberMatch(string $userVal, string $expectedRaw): bool
    {
        $cleanUser = self::normalizeAnswer($userVal);
        if ($cleanUser === '') return false;

        $candidates = preg_split('/[\/|,]/', $expectedRaw);

        foreach ($candidates as $candidate) {
            $cleanCand = self::normalizeAnswer($candidate);
            if ($cleanCand === '') continue;

            // 1. Direct match
            if ($cleanUser === $cleanCand) return true;

            // 2. Pure number conversion
            if (is_numeric($cleanCand)) {
                $candNum = (int)$cleanCand;
                $words = self::numberToWords($candNum);
                foreach ($words as $w) {
                    if ($cleanUser === self::normalizeAnswer($w)) return true;
                }
            }

            if (is_numeric($cleanUser)) {
                $userNum = (int)$cleanUser;
                $candNum = self::wordsToNumber($cleanCand);
                if ($candNum !== null && $userNum === $candNum) return true;
            }

            $userAsNum = self::wordsToNumber($cleanUser);
            if ($userAsNum !== null && is_numeric($cleanCand) && $userAsNum === (int)$cleanCand) {
                return true;
            }

            // 3. Number word replaced inside phrase (e.g. "two days" <-> "2 days")
            $numPattern = '/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/';
            $userWithDigit = preg_replace_callback($numPattern, function($m) {
                $n = self::wordsToNumber($m[1]);
                return $n !== null ? (string)$n : $m[1];
            }, $cleanUser);

            $candWithDigit = preg_replace_callback($numPattern, function($m) {
                $n = self::wordsToNumber($m[1]);
                return $n !== null ? (string)$n : $m[1];
            }, $cleanCand);

            if ($userWithDigit === $candWithDigit) return true;
            if (rtrim($userWithDigit, 's') === rtrim($candWithDigit, 's')) return true;

            // 4. Singular / Plural flexibility (trailing s)
            if (rtrim($cleanUser, 's') === rtrim($cleanCand, 's')) return true;

            // 5. No-space variant (e.g. "stomachache" <-> "stomach ache", "noone in" <-> "no one in")
            if (str_replace(' ', '', $cleanUser) === str_replace(' ', '', $cleanCand)) return true;

            // 6. Minor 1-character typo tolerance for long words (length >= 5)
            if (strlen($cleanCand) >= 5 && levenshtein($cleanUser, $cleanCand) <= 1) return true;
        }

        return false;
    }
}
