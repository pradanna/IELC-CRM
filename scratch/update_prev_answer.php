<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$latestSession = \App\Domains\Academic\Domain\Models\PtSession::latest()->first();

$ans = \App\Domains\Academic\Domain\Models\PtIeltsAnswer::where('pt_session_id', $latestSession->id)->first();
if ($ans) {
    $data = json_decode($ans->essay_text, true);
    $grid = $data['grid'] ?? [];
    $res = \App\Domains\Academic\Application\Services\IeltsAutoScoringService::gradeListening($grid);
    
    $ans->band_score = $res['band_score'];
    $ans->teacher_notes = "Auto-graded: {$res['raw_score']}/{$res['total_questions']} correct (Band {$res['band_score']})";
    $ans->save();

    $latestSession->final_score = $res['raw_score'];
    $latestSession->save();
    
    echo "Updated answer! Band: {$ans->band_score} | Notes: {$ans->teacher_notes} | Session final_score: {$latestSession->final_score}\n";
}
