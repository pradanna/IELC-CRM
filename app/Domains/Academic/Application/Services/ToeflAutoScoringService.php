<?php

namespace App\Domains\Academic\Application\Services;

class ToeflAutoScoringService
{
    /**
     * TOEFL PBT Section 1: Listening Comprehension Answer Keys (50 Questions)
     * Source: Model Test 8 (Barron's / Eli Hinkel)
     * Multi-answer questions:
     * - 32: ordering [D, A, C, B]
     * - 33: [C, D]
     * - 34: [A, C]
     * - 37: [B, C]
     * - 40: [B, D]
     * - 46: [B, C]
     * - 50: [A, D]
     */
    protected static array $pbtListeningKeys = [
        1  => ['a'],
        2  => ['c'],
        3  => ['a'],
        4  => ['c'],
        5  => ['b'],
        6  => ['c'],
        7  => ['c'],
        8  => ['c'],
        9  => ['d'],
        10 => ['a'],
        11 => ['c'],
        12 => ['c'],
        13 => ['c'],
        14 => ['b'],
        15 => ['d'],
        16 => ['a'],
        17 => ['b'],
        18 => ['c'],
        19 => ['a'],
        20 => ['c'],
        21 => ['b'],
        22 => ['b'],
        23 => ['c'],
        24 => ['c'],
        25 => ['a'],
        26 => ['b'],
        27 => ['d'],
        28 => ['c'],
        29 => ['a'],
        30 => ['c'],
        31 => ['b'],
        32 => ['order' => ['d', 'a', 'c', 'b']],
        33 => ['multi' => ['c', 'd']],
        34 => ['multi' => ['a', 'c']],
        35 => ['a'],
        36 => ['c'],
        37 => ['multi' => ['b', 'c']],
        38 => ['a'],
        39 => ['c'],
        40 => ['multi' => ['b', 'd']],
        41 => ['c'],
        42 => ['b'],
        43 => ['a'],
        44 => ['d'],
        45 => ['c'],
        46 => ['multi' => ['b', 'c']],
        47 => ['a'],
        48 => ['c'],
        49 => ['c'],
        50 => ['multi' => ['a', 'd']],
    ];

    /**
     * TOEFL PBT Section 2: Structure & Written Expression Answer Keys (40 Questions)
     * Source: Model Test 8 (Part A: 1-15, Part B: 16-40)
     */
    protected static array $pbtStructureKeys = [
        1  => ['a'],
        2  => ['c'],
        3  => ['d'],
        4  => ['a'],
        5  => ['b'],
        6  => ['c'],
        7  => ['a'],
        8  => ['c'],
        9  => ['c'],
        10 => ['d'],
        11 => ['c'],
        12 => ['a'],
        13 => ['c'],
        14 => ['d'],
        15 => ['c'],
        16 => ['a'],
        17 => ['b'],
        18 => ['c'],
        19 => ['b'],
        20 => ['d'],
        21 => ['b'],
        22 => ['a'],
        23 => ['d'],
        24 => ['b'],
        25 => ['a'],
        26 => ['d'],
        27 => ['b'],
        28 => ['d'],
        29 => ['c'],
        30 => ['b'],
        31 => ['a'],
        32 => ['c'],
        33 => ['b'],
        34 => ['b'],
        35 => ['d'],
        36 => ['c'],
        37 => ['b'],
        38 => ['a'],
        39 => ['d'],
        40 => ['d'],
    ];

    /**
     * TOEFL PBT Section 3: Reading Comprehension Answer Keys (50 Questions)
     * Source: Model Test 8 (1-50)
     */
    protected static array $pbtReadingKeys = [
        1  => ['c'],
        2  => ['d'],
        3  => ['a'],
        4  => ['b'],
        5  => ['b'],
        6  => ['a'],
        7  => ['b'],
        8  => ['a'],
        9  => ['d'],
        10 => ['c'],
        11 => ['b'],
        12 => ['d'],
        13 => ['b'],
        14 => ['c'],
        15 => ['a'],
        16 => ['b'],
        17 => ['c'],
        18 => ['d'],
        19 => ['c'],
        20 => ['a'],
        21 => ['b'],
        22 => ['d'],
        23 => ['a'],
        24 => ['b'],
        25 => ['c'],
        26 => ['b'],
        27 => ['d'],
        28 => ['c'],
        29 => ['b'],
        30 => ['a'],
        31 => ['d'],
        32 => ['b'],
        33 => ['c'],
        34 => ['d'],
        35 => ['a'],
        36 => ['c'],
        37 => ['d'],
        38 => ['b'],
        39 => ['c'],
        40 => ['c'],
        41 => ['a'],
        42 => ['c'],
        43 => ['d'],
        44 => ['a'],
        45 => ['d'],
        46 => ['b'],
        47 => ['c'],
        48 => ['a'],
        49 => ['d'],
        50 => ['d'],
    ];

    /**
     * TOEFL iBT Reading Answer Keys (20 Questions: 2 Passages x 10 Qs)
     * Source: Barron's Model Test 1 Pretest (Beowulf & Thermoregulation)
     * Multi-answer questions:
     * - 10: [E, D, F]
     * - 20: [E, C, F]
     */
    protected static array $ibtReadingKeys = [
        1  => ['c'],
        2  => ['b'],
        3  => ['a'],
        4  => ['a'],
        5  => ['b'],
        6  => ['b'],
        7  => ['c'],
        8  => ['a'],
        9  => ['b'],
        10 => ['multi' => ['e', 'd', 'f']],
        11 => ['a'],
        12 => ['d'],
        13 => ['d'],
        14 => ['a'],
        15 => ['d'],
        16 => ['d'],
        17 => ['b'],
        18 => ['b'],
        19 => ['a'],
        20 => ['multi' => ['e', 'c', 'f']],
    ];

    /**
     * TOEFL iBT Listening Answer Keys (28 Questions: 5 audio items)
     * Source: Barron's Model Test 1 Pretest
     * Multi-answer questions:
     * - 20: [A, C]
     */
    protected static array $ibtListeningKeys = [
        1  => ['b'],
        2  => ['d'],
        3  => ['c'],
        4  => ['b'],
        5  => ['d'],
        6  => ['c'],
        7  => ['c'],
        8  => ['a'],
        9  => ['b'],
        10 => ['b'],
        11 => ['b'],
        12 => ['b'],
        13 => ['c'],
        14 => ['b'],
        15 => ['c'],
        16 => ['c'],
        17 => ['c'],
        18 => ['c'],
        19 => ['b'],
        20 => ['multi' => ['a', 'c']],
        21 => ['a'],
        22 => ['d'],
        23 => ['a'],
        24 => ['b'],
        25 => ['d'],
        26 => ['d'],
        27 => ['c'],
        28 => ['c'],
    ];

    /**
     * Normalize text for comparison (case-insensitive, trimmed, extract letters)
     */
    public static function normalize(mixed $text): string
    {
        if ($text === null || !is_scalar($text)) {
            return '';
        }
        $str = strtolower(trim((string) $text));
        $str = str_replace(["\r", "\n", "\t"], ' ', $str);
        return trim(preg_replace('/\s+/', ' ', $str));
    }

    /**
     * Extract sequence or set of choice letters (e.g. "C, D" -> ['c', 'd'], "DACB" -> ['d', 'a', 'c', 'b'])
     */
    public static function extractLetters(string $text): array
    {
        $normalized = self::normalize($text);
        if ($normalized === '') {
            return [];
        }
        // Extract all isolated characters a-z
        preg_match_all('/[a-z]/i', $normalized, $matches);
        return array_map('strtolower', $matches[0] ?? []);
    }

    /**
     * Evaluate single or multi/ordering item
     */
    protected static function evaluateItem(mixed $userAnswer, mixed $expected): array
    {
        $rawUser = self::normalize($userAnswer);
        $extracted = self::extractLetters($rawUser);

        // Case 1: Sequence ordering
        if (is_array($expected) && isset($expected['order'])) {
            $expectedOrder = $expected['order'];
            $isCorrect = ($extracted === $expectedOrder);
            return [
                'is_correct' => $isCorrect,
                'user_answer' => $userAnswer,
                'acceptable_keys' => [strtoupper(implode('-', $expectedOrder))],
            ];
        }

        // Case 2: Multi-selection (all-or-nothing, order insensitive)
        if (is_array($expected) && isset($expected['multi'])) {
            $expectedSet = $expected['multi'];
            sort($expectedSet);
            $userSet = array_values(array_unique($extracted));
            sort($userSet);

            $isCorrect = ($userSet === $expectedSet);
            return [
                'is_correct' => $isCorrect,
                'user_answer' => $userAnswer,
                'acceptable_keys' => [strtoupper(implode(', ', $expected['multi']))],
            ];
        }

        // Case 3: Standard single letter choice
        $validChoices = is_array($expected) ? $expected : [$expected];
        $validNormalized = array_map('strtolower', $validChoices);
        
        // Match if user string equals key OR user extracted letters has single match
        $isCorrect = in_array($rawUser, $validNormalized, true) 
            || (count($extracted) === 1 && in_array($extracted[0], $validNormalized, true));

        return [
            'is_correct' => $isCorrect,
            'user_answer' => $userAnswer,
            'acceptable_keys' => array_map('strtoupper', $validChoices),
        ];
    }

    /**
     * Grade TOEFL PBT Listening (1-50)
     */
    public static function gradePbtListening(array $userAnswers): array
    {
        $rawScore = 0;
        $itemResults = [];

        for ($i = 1; $i <= 50; $i++) {
            $userAns = $userAnswers[$i] ?? $userAnswers[(string) $i] ?? '';
            $eval = self::evaluateItem($userAns, self::$pbtListeningKeys[$i] ?? []);
            if ($eval['is_correct']) {
                $rawScore++;
            }
            $itemResults[$i] = $eval;
        }

        $scaledScore = self::calculatePbtListeningScaledScore($rawScore);

        return [
            'raw_score' => $rawScore,
            'total_questions' => 50,
            'scaled_score' => $scaledScore,
            'band_score' => $scaledScore,
            'item_results' => $itemResults,
        ];
    }

    /**
     * Grade TOEFL PBT Structure (1-40)
     */
    public static function gradePbtStructure(array $userAnswers): array
    {
        $rawScore = 0;
        $itemResults = [];

        for ($i = 1; $i <= 40; $i++) {
            $userAns = $userAnswers[$i] ?? $userAnswers[(string) $i] ?? '';
            $eval = self::evaluateItem($userAns, self::$pbtStructureKeys[$i] ?? []);
            if ($eval['is_correct']) {
                $rawScore++;
            }
            $itemResults[$i] = $eval;
        }

        $scaledScore = self::calculatePbtStructureScaledScore($rawScore);

        return [
            'raw_score' => $rawScore,
            'total_questions' => 40,
            'scaled_score' => $scaledScore,
            'band_score' => $scaledScore,
            'item_results' => $itemResults,
        ];
    }

    /**
     * Grade TOEFL PBT Reading (1-50)
     */
    public static function gradePbtReading(array $userAnswers): array
    {
        $rawScore = 0;
        $itemResults = [];

        for ($i = 1; $i <= 50; $i++) {
            $userAns = $userAnswers[$i] ?? $userAnswers[(string) $i] ?? '';
            $eval = self::evaluateItem($userAns, self::$pbtReadingKeys[$i] ?? []);
            if ($eval['is_correct']) {
                $rawScore++;
            }
            $itemResults[$i] = $eval;
        }

        $scaledScore = self::calculatePbtReadingScaledScore($rawScore);

        return [
            'raw_score' => $rawScore,
            'total_questions' => 50,
            'scaled_score' => $scaledScore,
            'band_score' => $scaledScore,
            'item_results' => $itemResults,
        ];
    }

    /**
     * Grade TOEFL iBT Reading (1-20)
     */
    public static function gradeIbtReading(array $userAnswers): array
    {
        $rawScore = 0;
        $itemResults = [];

        for ($i = 1; $i <= 20; $i++) {
            $userAns = $userAnswers[$i] ?? $userAnswers[(string) $i] ?? '';
            $eval = self::evaluateItem($userAns, self::$ibtReadingKeys[$i] ?? []);
            if ($eval['is_correct']) {
                $rawScore++;
            }
            $itemResults[$i] = $eval;
        }

        $scaledScore = self::calculateIbtReadingScaledScore($rawScore);

        return [
            'raw_score' => $rawScore,
            'total_questions' => 20,
            'scaled_score' => $scaledScore,
            'band_score' => $scaledScore,
            'item_results' => $itemResults,
        ];
    }

    /**
     * Grade TOEFL iBT Listening (1-28)
     */
    public static function gradeIbtListening(array $userAnswers): array
    {
        $rawScore = 0;
        $itemResults = [];

        for ($i = 1; $i <= 28; $i++) {
            $userAns = $userAnswers[$i] ?? $userAnswers[(string) $i] ?? '';
            $eval = self::evaluateItem($userAns, self::$ibtListeningKeys[$i] ?? []);
            if ($eval['is_correct']) {
                $rawScore++;
            }
            $itemResults[$i] = $eval;
        }

        $scaledScore = self::calculateIbtListeningScaledScore($rawScore);

        return [
            'raw_score' => $rawScore,
            'total_questions' => 28,
            'scaled_score' => $scaledScore,
            'band_score' => $scaledScore,
            'item_results' => $itemResults,
        ];
    }

    /**
     * Convert TOEFL PBT Listening Raw Score (0-50) to Scaled Score (31-68)
     */
    public static function calculatePbtListeningScaledScore(int $raw): float
    {
        if ($raw >= 50) return 68.0;
        if ($raw >= 49) return 67.0;
        if ($raw >= 48) return 66.0;
        if ($raw >= 47) return 65.0;
        if ($raw >= 46) return 63.0;
        if ($raw >= 45) return 62.0;
        if ($raw >= 44) return 61.0;
        if ($raw >= 43) return 60.0;
        if ($raw >= 42) return 59.0;
        if ($raw >= 41) return 58.0;
        if ($raw >= 40) return 57.0;
        if ($raw >= 39) return 57.0;
        if ($raw >= 38) return 56.0;
        if ($raw >= 37) return 55.0;
        if ($raw >= 36) return 54.0;
        if ($raw >= 35) return 54.0;
        if ($raw >= 34) return 53.0;
        if ($raw >= 33) return 52.0;
        if ($raw >= 32) return 52.0;
        if ($raw >= 31) return 51.0;
        if ($raw >= 30) return 51.0;
        if ($raw >= 29) return 50.0;
        if ($raw >= 28) return 49.0;
        if ($raw >= 27) return 49.0;
        if ($raw >= 26) return 48.0;
        if ($raw >= 25) return 48.0;
        if ($raw >= 24) return 47.0;
        if ($raw >= 23) return 47.0;
        if ($raw >= 22) return 46.0;
        if ($raw >= 21) return 45.0;
        if ($raw >= 20) return 45.0;
        if ($raw >= 19) return 44.0;
        if ($raw >= 18) return 43.0;
        if ($raw >= 17) return 43.0;
        if ($raw >= 16) return 42.0;
        if ($raw >= 15) return 41.0;
        if ($raw >= 14) return 41.0;
        if ($raw >= 13) return 40.0;
        if ($raw >= 12) return 39.0;
        if ($raw >= 11) return 38.0;
        if ($raw >= 10) return 37.0;
        if ($raw >= 9)  return 36.0;
        if ($raw >= 8)  return 35.0;
        if ($raw >= 7)  return 34.0;
        if ($raw >= 6)  return 33.0;
        if ($raw >= 5)  return 32.0;
        return 31.0;
    }

    /**
     * Convert TOEFL PBT Structure Raw Score (0-40) to Scaled Score (31-68)
     */
    public static function calculatePbtStructureScaledScore(int $raw): float
    {
        if ($raw >= 40) return 68.0;
        if ($raw >= 39) return 67.0;
        if ($raw >= 38) return 65.0;
        if ($raw >= 37) return 63.0;
        if ($raw >= 36) return 61.0;
        if ($raw >= 35) return 60.0;
        if ($raw >= 34) return 58.0;
        if ($raw >= 33) return 57.0;
        if ($raw >= 32) return 56.0;
        if ($raw >= 31) return 55.0;
        if ($raw >= 30) return 54.0;
        if ($raw >= 29) return 53.0;
        if ($raw >= 28) return 52.0;
        if ($raw >= 27) return 51.0;
        if ($raw >= 26) return 50.0;
        if ($raw >= 25) return 49.0;
        if ($raw >= 24) return 48.0;
        if ($raw >= 23) return 47.0;
        if ($raw >= 22) return 46.0;
        if ($raw >= 21) return 45.0;
        if ($raw >= 20) return 44.0;
        if ($raw >= 19) return 43.0;
        if ($raw >= 18) return 43.0;
        if ($raw >= 17) return 42.0;
        if ($raw >= 16) return 41.0;
        if ($raw >= 15) return 40.0;
        if ($raw >= 14) return 39.0;
        if ($raw >= 13) return 38.0;
        if ($raw >= 12) return 37.0;
        if ($raw >= 11) return 36.0;
        if ($raw >= 10) return 35.0;
        if ($raw >= 9)  return 34.0;
        if ($raw >= 8)  return 33.0;
        if ($raw >= 7)  return 32.0;
        return 31.0;
    }

    /**
     * Convert TOEFL PBT Reading Raw Score (0-50) to Scaled Score (31-67)
     */
    public static function calculatePbtReadingScaledScore(int $raw): float
    {
        if ($raw >= 50) return 67.0;
        if ($raw >= 49) return 66.0;
        if ($raw >= 48) return 65.0;
        if ($raw >= 47) return 63.0;
        if ($raw >= 46) return 61.0;
        if ($raw >= 45) return 60.0;
        if ($raw >= 44) return 59.0;
        if ($raw >= 43) return 58.0;
        if ($raw >= 42) return 57.0;
        if ($raw >= 41) return 56.0;
        if ($raw >= 40) return 55.0;
        if ($raw >= 39) return 54.0;
        if ($raw >= 38) return 54.0;
        if ($raw >= 37) return 53.0;
        if ($raw >= 36) return 52.0;
        if ($raw >= 35) return 52.0;
        if ($raw >= 34) return 51.0;
        if ($raw >= 33) return 50.0;
        if ($raw >= 32) return 49.0;
        if ($raw >= 31) return 48.0;
        if ($raw >= 30) return 48.0;
        if ($raw >= 29) return 47.0;
        if ($raw >= 28) return 46.0;
        if ($raw >= 27) return 46.0;
        if ($raw >= 26) return 45.0;
        if ($raw >= 25) return 44.0;
        if ($raw >= 24) return 43.0;
        if ($raw >= 23) return 43.0;
        if ($raw >= 22) return 42.0;
        if ($raw >= 21) return 41.0;
        if ($raw >= 20) return 40.0;
        if ($raw >= 19) return 39.0;
        if ($raw >= 18) return 38.0;
        if ($raw >= 17) return 37.0;
        if ($raw >= 16) return 36.0;
        if ($raw >= 15) return 35.0;
        if ($raw >= 14) return 34.0;
        if ($raw >= 13) return 32.0;
        if ($raw >= 12) return 31.0;
        return 31.0;
    }

    /**
     * Calculate Total TOEFL PBT Score (310 - 677)
     */
    public static function calculateTotalPbtScore(float $listScaled, float $structScaled, float $readScaled): int
    {
        return (int) round((($listScaled + $structScaled + $readScaled) * 10) / 3);
    }

    /**
     * Convert TOEFL iBT Reading Raw Score (0-20) to Scaled Score (0-30)
     */
    public static function calculateIbtReadingScaledScore(int $raw): float
    {
        return round(($raw / 20.0) * 30.0, 1);
    }

    /**
     * Convert TOEFL iBT Listening Raw Score (0-28) to Scaled Score (0-30)
     */
    public static function calculateIbtListeningScaledScore(int $raw): float
    {
        return round(($raw / 28.0) * 30.0, 1);
    }

    /**
     * Dispatch auto-grading for a TOEFL task by exam slug
     */
    public static function gradeTask(string $examSlug, mixed $task, array $grid): ?array
    {
        $skill = is_object($task) ? ($task->skill_type ?? '') : ($task['skill_type'] ?? '');
        $title = strtolower(is_object($task) ? ($task->title ?? '') : ($task['title'] ?? ''));
        $position = (int) (is_object($task) ? ($task->position ?? 0) : ($task['position'] ?? 0));

        if ($examSlug === 'toefl-pbt-placement-test') {
            if ($skill === 'listening' || $position === 1) {
                return self::gradePbtListening($grid);
            }
            if ($skill === 'reading') {
                if ($position === 2 || str_contains($title, 'structure')) {
                    return self::gradePbtStructure($grid);
                }
                return self::gradePbtReading($grid);
            }
        } elseif ($examSlug === 'toefl-ibt-placement-test') {
            if ($skill === 'reading' || $position === 1) {
                return self::gradeIbtReading($grid);
            }
            if ($skill === 'listening' || $position === 2) {
                return self::gradeIbtListening($grid);
            }
        }

        return null;
    }
}
