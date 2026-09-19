<?php
require dirname(__DIR__) . '/vendor/autoload.php';

use App\Domains\Academic\Application\Services\IeltsAutoScoringService;

$readingTestAnswers = [
    1 => 'population',
    2 => 'SUBURBS', // uppercase check
    7 => 'FALSE',
    23 => 'D', // either order check
    24 => 'C',
    25 => 'E', // either order check
    26 => 'B',
];

$readingResult = IeltsAutoScoringService::gradeReading($readingTestAnswers);
echo "Reading Raw Score: " . $readingResult['raw_score'] . "/40\n";
echo "Reading Band Score: " . $readingResult['band_score'] . "\n";

$listeningTestAnswers = [
    1 => 'rajdoot',
    2 => 'Park View Hotel', // optional phrase check
    25 => 'educational', // any order check
    26 => 'safe for children',
    27 => 'cheap', // synonym check
];

$listeningResult = IeltsAutoScoringService::gradeListening($listeningTestAnswers);
echo "Listening Raw Score: " . $listeningResult['raw_score'] . "/40\n";
echo "Listening Band Score: " . $listeningResult['band_score'] . "\n";
