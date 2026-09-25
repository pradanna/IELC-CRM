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
     * Convert TOEFL PBT Listening Raw Score (0-50) to Scaled Score (27-68)
     * Source: Table 1 Score Conversion Table (Column L + R) - always taking the right-hand (upper bound) score.
     */
    public static function calculatePbtListeningScaledScore(int $raw): float
    {
        return match (true) {
            $raw >= 48 => 68.0, // 48-50 -> 65-68
            $raw >= 46 => 64.0, // 46-47 -> 62-64
            $raw >= 44 => 61.0, // 44-45 -> 59-61
            $raw >= 41 => 58.0, // 41-43 -> 56-58
            $raw >= 38 => 55.0, // 38-40 -> 54-55
            $raw >= 35 => 53.0, // 35-37 -> 52-53
            $raw >= 33 => 51.0, // 33-34 -> 50-51
            $raw >= 30 => 49.0, // 30-32 -> 48-49
            $raw >= 27 => 47.0, // 27-29 -> 46-47
            $raw >= 24 => 45.0, // 24-26 -> 44-45
            $raw >= 21 => 43.0, // 21-23 -> 42-43
            $raw >= 18 => 41.0, // 18-20 -> 40-41
            $raw >= 15 => 39.0, // 15-17 -> 38-39
            $raw >= 12 => 37.0, // 12-14 -> 36-37
            $raw >= 9  => 35.0, // 9-11  -> 34-35
            $raw >= 6  => 33.0, // 6-8   -> 32-33
            $raw >= 4  => 31.0, // 4-5   -> 29-31
            default    => 27.0, // 0-3   -> 25-27
        };
    }

    /**
     * Convert TOEFL PBT Structure Raw Score (0-40) to Scaled Score (24-68)
     * Source: Table 1 Score Conversion Table (Column S) - always taking the right-hand (upper bound) score.
     */
    public static function calculatePbtStructureScaledScore(int $raw): float
    {
        return match (true) {
            $raw >= 38 => 68.0, // 38-40 -> 63-68
            $raw >= 35 => 62.0, // 35-37 -> 59-62
            $raw >= 33 => 58.0, // 33-34 -> 57-58
            $raw >= 30 => 56.0, // 30-32 -> 54-56
            $raw >= 27 => 53.0, // 27-29 -> 51-53
            $raw >= 24 => 50.0, // 24-26 -> 48-50
            $raw >= 21 => 47.0, // 21-23 -> 45-47
            $raw >= 18 => 43.0, // 18-20 -> 42-43
            $raw >= 15 => 41.0, // 15-17 -> 39-41
            $raw >= 12 => 38.0, // 12-14 -> 37-38
            $raw >= 9  => 36.0, // 9-11  -> 33-36
            $raw >= 6  => 31.0, // 6-8   -> 29-31
            $raw >= 4  => 28.0, // 4-5   -> 25-28
            default    => 24.0, // 0-3   -> 20-24
        };
    }

    /**
     * Convert TOEFL PBT Reading Raw Score (0-50) to Scaled Score (27-68)
     * Source: Table 1 Score Conversion Table (Column L + R) - always taking the right-hand (upper bound) score.
     */
    public static function calculatePbtReadingScaledScore(int $raw): float
    {
        return self::calculatePbtListeningScaledScore($raw);
    }

    /**
     * Calculate Total TOEFL PBT Score (310 - 677)
     */
    public static function calculateTotalPbtScore(float $listScaled, float $structScaled, float $readScaled): int
    {
        $calculated = (int) round((($listScaled + $structScaled + $readScaled) * 10) / 3);
        return min(677, max(310, $calculated));
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
