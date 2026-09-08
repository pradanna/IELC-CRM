<?php

namespace App\Domains\Academic\Application\Services;

class IeltsAutoScoringService
{
    /**
     * IELTS Reading Academic Answer Keys (40 Questions)
     */
    protected static array $readingKeys = [
        1  => ['population'],
        2  => ['suburbs'],
        3  => ['businessmen'],
        4  => ['funding'],
        5  => ['press'],
        6  => ['soil'],
        7  => ['false'],
        8  => ['not given'],
        9  => ['true'],
        10 => ['true'],
        11 => ['false'],
        12 => ['false'],
        13 => ['not given'],
        14 => ['a'],
        15 => ['f'],
        16 => ['e'],
        17 => ['d'],
        18 => ['fortress'],
        19 => ['bullfights', 'bull fights', 'bullfight'],
        20 => ['opera'],
        21 => ['salt'],
        22 => ['shops'],
        // 23 & 24 IN EITHER ORDER: C & D
        23 => ['c', 'd'],
        24 => ['c', 'd'],
        // 25 & 26 IN EITHER ORDER: B & E
        25 => ['b', 'e'],
        26 => ['b', 'e'],
        27 => ['h'],
        28 => ['j'],
        29 => ['f'],
        30 => ['b'],
        31 => ['d'],
        32 => ['not given'],
        33 => ['no'],
        34 => ['no'],
        35 => ['yes'],
        36 => ['b'],
        37 => ['c'],
        38 => ['a'],
        39 => ['b'],
        40 => ['d'],
    ];

    /**
     * IELTS Listening Academic Answer Keys (40 Questions)
     */
    protected static array $listeningKeys = [
        1  => ['rajdoot'],
        2  => ['park view', 'park view hotel'],
        3  => ['london arms'],
        4  => ['208657'],
        5  => ['no smoking section', 'no smoking area', 'non-smoking section', 'non-smoking area', 'non smoking section', 'non smoking area'],
        6  => ['lentil curry'],
        7  => [
            'fifty pound deposit', 'fifty pounds deposit', '50 deposit', '50 pounds deposit', '50 pound deposit',
            'deposit of 50', 'deposit of fifty', 'deposit of fifty pounds', 'deposit of fifty pound', 'fifty pounds', 'fifty pound', '50'
        ],
        8  => ['choose on the menu', 'decide on the menu', 'select the menu', 'select menu', 'choose the menu'],
        9  => ['4 november', 'november 4', '4th november', 'november 4th', '4th of november'],
        10 => ['newsletter', 'the newsletter'],
        11 => ['9.50', '9,50', '9.5'],
        12 => ['year', 'annum', 'a year', 'per year', 'per annum'],
        13 => ['reception'],
        14 => ['card'],
        15 => ['book'],
        16 => ['weekdays', 'weekday'],
        17 => ['reception', 'reception area'],
        18 => ['dance studio'],
        19 => ['squash courts', 'squash court'],
        20 => ['fitness room'],
        21 => ['anne rea'],
        22 => ['16', '16 years old', 'both 16', 'both 16 years old', 'sixteen', 'sixteen years old'],
        23 => ['blind puzzle', 'blind jigsaw puzzle', 'blind jigsaw'],
        24 => [
            '20, 50, 2.5', '20 cm, 50 cm, 2.5 cm', '20cm, 50cm, 2.5cm',
            '20 cm, 50 cm, 2 and a half cm', '20, 50, 2 1/2', '20cm, 50cm, 2.5',
            '20, 50, 2.5 cm', '20 cm, 50 cm, 2 and a half'
        ],
        // 25, 26, 27 IN ANY ORDER
        25 => ['safe for children', 'child safe', 'educational', 'inexpensive', 'not expensive', 'cheap', 'good price', 'price is good', 'inexpensive price', 'cheap price'],
        26 => ['safe for children', 'child safe', 'educational', 'inexpensive', 'not expensive', 'cheap', 'good price', 'price is good', 'inexpensive price', 'cheap price'],
        27 => ['safe for children', 'child safe', 'educational', 'inexpensive', 'not expensive', 'cheap', 'good price', 'price is good', 'inexpensive price', 'cheap price'],
        28 => ['electrics'],
        29 => ['plastic pieces', 'in plastic', 'plastic'],
        30 => ['1 july', 'july 1', 'july 1st', '1st july', '1st of july'],
        31 => ['rabbit', 'rabbit meat'],
        32 => ['tough', 'rather tough'],
        33 => ['beef'],
        34 => ['fans', 'feather fans', 'ladies fans', 'ladies feather fans', "ladies' feather fans", "ladies' fans"],
        35 => ['delicate leather', 'fine leather', 'good quality leather', 'leather'],
        36 => ['meat'],
        37 => ['a'],
        38 => ['c'],
        39 => ['c'],
        40 => ['b'],
    ];

    /**
     * Convert IELTS Raw Score (0-40) to Academic Reading Band Score (1.0 - 9.0)
     */
    public static function calculateReadingBandScore(int $rawScore): float
    {
        return match (true) {
            $rawScore >= 39 => 9.0,
            $rawScore >= 37 => 8.5,
            $rawScore >= 35 => 8.0,
            $rawScore >= 33 => 7.5,
            $rawScore >= 30 => 7.0,
            $rawScore >= 27 => 6.5,
            $rawScore >= 23 => 6.0,
            $rawScore >= 19 => 5.5,
            $rawScore >= 15 => 5.0,
            $rawScore >= 13 => 4.5,
            $rawScore >= 10 => 4.0,
            $rawScore >= 8  => 3.5,
            $rawScore >= 6  => 3.0,
            $rawScore >= 4  => 2.5,
            $rawScore >= 2  => 2.0,
            $rawScore >= 1  => 1.0,
            default         => 0.0,
        };
    }

    /**
     * Convert IELTS Raw Score (0-40) to Academic Listening Band Score (1.0 - 9.0)
     */
    public static function calculateListeningBandScore(int $rawScore): float
    {
        return match (true) {
            $rawScore >= 39 => 9.0,
            $rawScore >= 37 => 8.5,
            $rawScore >= 35 => 8.0,
            $rawScore >= 32 => 7.5,
            $rawScore >= 30 => 7.0,
            $rawScore >= 26 => 6.5,
            $rawScore >= 23 => 6.0,
            $rawScore >= 18 => 5.5,
            $rawScore >= 16 => 5.0,
            $rawScore >= 13 => 4.5,
            $rawScore >= 10 => 4.0,
            $rawScore >= 8  => 3.5,
            $rawScore >= 6  => 3.0,
            $rawScore >= 4  => 2.5,
            $rawScore >= 2  => 2.0,
            $rawScore >= 1  => 1.0,
            default         => 0.0,
        };
    }

    /**
     * Normalize text for comparison (case-insensitive, trimmed, unified whitespace)
     */
    public static function normalize(mixed $text): string
    {
        if ($text === null || !is_scalar($text)) {
            return '';
        }

        $str = (string) $text;
        $str = strtolower($str);
        // Replace punctuation or special quotes with standard form
        $str = str_replace(["’", "‘", "`"], "'", $str);
        // Remove surrounding quotes and brackets
        $str = trim($str, " \"'()[]{}.,");
        // Collapse multiple whitespaces
        $str = preg_replace('/\s+/', ' ', $str);

        return trim($str);
    }

    /**
     * Grade IELTS Reading Answer Sheet (1-40)
     *
     * @param array $userAnswers [1 => 'population', 2 => 'suburbs', ...]
     * @return array [
     *     'raw_score' => int,
     *     'total_questions' => 40,
     *     'band_score' => float,
     *     'item_results' => array, // [1 => ['is_correct' => bool, 'user_answer' => string, 'key' => array]]
     * ]
     */
    public static function gradeReading(array $userAnswers): array
    {
        $rawScore = 0;
        $itemResults = [];

        // Handle standard 1-22 and 27-40
        for ($i = 1; $i <= 40; $i++) {
            // Handle Either Order for 23 & 24
            if ($i === 23 || $i === 24) {
                continue;
            }
            // Handle Either Order for 25 & 26
            if ($i === 25 || $i === 26) {
                continue;
            }

            $userVal = self::normalize($userAnswers[$i] ?? $userAnswers[(string)$i] ?? '');
            $expectedKeys = array_map([self::class, 'normalize'], self::$readingKeys[$i] ?? []);

            $isCorrect = in_array($userVal, $expectedKeys, true);
            if ($isCorrect && $userVal !== '') {
                $rawScore++;
            }

            $itemResults[$i] = [
                'is_correct' => $isCorrect,
                'user_answer' => $userAnswers[$i] ?? $userAnswers[(string)$i] ?? '',
                'acceptable_keys' => self::$readingKeys[$i] ?? [],
            ];
        }

        // Evaluate Q23 & Q24 (IN EITHER ORDER: C & D)
        $ans23 = self::normalize($userAnswers[23] ?? $userAnswers['23'] ?? '');
        $ans24 = self::normalize($userAnswers[24] ?? $userAnswers['24'] ?? '');
        $validPair2324 = ['c', 'd'];

        $used2324 = [];
        $is23Correct = in_array($ans23, $validPair2324, true) && !in_array($ans23, $used2324, true);
        if ($is23Correct) {
            $used2324[] = $ans23;
            $rawScore++;
        }
        $is24Correct = in_array($ans24, $validPair2324, true) && !in_array($ans24, $used2324, true);
        if ($is24Correct) {
            $used2324[] = $ans24;
            $rawScore++;
        }
        $itemResults[23] = [
            'is_correct' => $is23Correct,
            'user_answer' => $userAnswers[23] ?? $userAnswers['23'] ?? '',
            'acceptable_keys' => ['C or D (in either order)'],
        ];
        $itemResults[24] = [
            'is_correct' => $is24Correct,
            'user_answer' => $userAnswers[24] ?? $userAnswers['24'] ?? '',
            'acceptable_keys' => ['C or D (in either order)'],
        ];

        // Evaluate Q25 & Q26 (IN EITHER ORDER: B & E)
        $ans25 = self::normalize($userAnswers[25] ?? $userAnswers['25'] ?? '');
        $ans26 = self::normalize($userAnswers[26] ?? $userAnswers['26'] ?? '');
        $validPair2526 = ['b', 'e'];

        $used2526 = [];
        $is25Correct = in_array($ans25, $validPair2526, true) && !in_array($ans25, $used2526, true);
        if ($is25Correct) {
            $used2526[] = $ans25;
            $rawScore++;
        }
        $is26Correct = in_array($ans26, $validPair2526, true) && !in_array($ans26, $used2526, true);
        if ($is26Correct) {
            $used2526[] = $ans26;
            $rawScore++;
        }
        $itemResults[25] = [
            'is_correct' => $is25Correct,
            'user_answer' => $userAnswers[25] ?? $userAnswers['25'] ?? '',
            'acceptable_keys' => ['B or E (in either order)'],
        ];
        $itemResults[26] = [
            'is_correct' => $is26Correct,
            'user_answer' => $userAnswers[26] ?? $userAnswers['26'] ?? '',
            'acceptable_keys' => ['B or E (in either order)'],
        ];

        ksort($itemResults);

        return [
            'raw_score' => $rawScore,
            'total_questions' => 40,
            'band_score' => self::calculateReadingBandScore($rawScore),
            'item_results' => $itemResults,
        ];
    }

    /**
     * Grade IELTS Listening Answer Sheet (1-40)
     */
    public static function gradeListening(array $userAnswers): array
    {
        $rawScore = 0;
        $itemResults = [];

        // Groups for 25, 26, 27 IN ANY ORDER:
        // Group A: safe for children
        // Group B: educational
        // Group C: inexpensive / cheap / good price
        $groupA = ['safe for children', 'child safe', 'safe children'];
        $groupB = ['educational'];
        $groupC = ['inexpensive', 'not expensive', 'cheap', 'good price', 'price is good', 'inexpensive price', 'cheap price', 'not expensive price'];

        $usedGroups = [];

        for ($i = 1; $i <= 40; $i++) {
            if ($i >= 25 && $i <= 27) {
                continue;
            }

            $userVal = self::normalize($userAnswers[$i] ?? $userAnswers[(string)$i] ?? '');
            $expectedKeys = array_map([self::class, 'normalize'], self::$listeningKeys[$i] ?? []);

            $isCorrect = false;
            foreach ($expectedKeys as $key) {
                if ($userVal === $key) {
                    $isCorrect = true;
                    break;
                }
            }

            if ($isCorrect && $userVal !== '') {
                $rawScore++;
            }

            $itemResults[$i] = [
                'is_correct' => $isCorrect,
                'user_answer' => $userAnswers[$i] ?? $userAnswers[(string)$i] ?? '',
                'acceptable_keys' => self::$listeningKeys[$i] ?? [],
            ];
        }

        // Evaluate Q25-Q27 IN ANY ORDER
        for ($i = 25; $i <= 27; $i++) {
            $userVal = self::normalize($userAnswers[$i] ?? $userAnswers[(string)$i] ?? '');
            $matchedGroup = null;

            if ($userVal !== '') {
                if (!isset($usedGroups['A']) && self::matchesAny($userVal, $groupA)) {
                    $matchedGroup = 'A';
                } elseif (!isset($usedGroups['B']) && self::matchesAny($userVal, $groupB)) {
                    $matchedGroup = 'B';
                } elseif (!isset($usedGroups['C']) && self::matchesAny($userVal, $groupC)) {
                    $matchedGroup = 'C';
                }
            }

            if ($matchedGroup) {
                $usedGroups[$matchedGroup] = true;
                $rawScore++;
                $itemResults[$i] = [
                    'is_correct' => true,
                    'user_answer' => $userAnswers[$i] ?? $userAnswers[(string)$i] ?? '',
                    'acceptable_keys' => ['Safe for children / Educational / Inexpensive (in any order)'],
                ];
            } else {
                $itemResults[$i] = [
                    'is_correct' => false,
                    'user_answer' => $userAnswers[$i] ?? $userAnswers[(string)$i] ?? '',
                    'acceptable_keys' => ['Safe for children / Educational / Inexpensive (in any order)'],
                ];
            }
        }

        ksort($itemResults);

        return [
            'raw_score' => $rawScore,
            'total_questions' => 40,
            'band_score' => self::calculateListeningBandScore($rawScore),
            'item_results' => $itemResults,
        ];
    }

    protected static function matchesAny(string $userVal, array $candidates): bool
    {
        foreach ($candidates as $cand) {
            if ($userVal === self::normalize($cand)) {
                return true;
            }
        }
        return false;
    }
}
