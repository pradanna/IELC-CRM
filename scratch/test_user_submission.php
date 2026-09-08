<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$latestSession = \App\Domains\Academic\Domain\Models\PtSession::latest()->first();
$ans = \App\Domains\Academic\Domain\Models\PtIeltsAnswer::where('pt_session_id', $latestSession->id)->first();

$data = json_decode($ans->essay_text, true);
$grid = $data['grid'] ?? [];

echo "User Answers in DB:\n";
print_r(array_slice($grid, 0, 15, true));

$grade = \App\Domains\Academic\Application\Services\IeltsAutoScoringService::gradeListening($grid);
echo "\nGrading Result:\n";
echo "Raw score: " . $grade['raw_score'] . "\n";
echo "Band score: " . $grade['band_score'] . "\n";
echo "Item 1:\n";
print_r($grade['item_results'][1] ?? []);
echo "Item 2:\n";
print_r($grade['item_results'][2] ?? []);
echo "Item 3:\n";
print_r($grade['item_results'][3] ?? []);
echo "Item 4:\n";
print_r($grade['item_results'][4] ?? []);
