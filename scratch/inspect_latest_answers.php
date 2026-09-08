<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$latestSession = \App\Domains\Academic\Domain\Models\PtSession::latest()->first();
echo "Latest Session ID: " . $latestSession->id . " | Token: " . $latestSession->token . PHP_EOL;
echo "Final Score: " . var_export($latestSession->final_score, true) . " | Is Graded: " . var_export($latestSession->is_graded, true) . " | Status: " . $latestSession->status . PHP_EOL;

$exam = $latestSession->ptExam;
echo "Exam Title: " . $exam->title . PHP_EOL;
$exam->load('ieltsTasks');
foreach ($exam->ieltsTasks as $t) {
    echo "Exam Task: ID={$t->id} | Skill={$t->skill_type} | Title={$t->title}" . PHP_EOL;
}
