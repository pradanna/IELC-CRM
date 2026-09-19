<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$latestSession = \App\Domains\Academic\Domain\Models\PtSession::latest()->first();
$tasks = \App\Domains\Academic\Domain\Models\PtIeltsTask::where('pt_exam_id', $latestSession->pt_exam_id)->get();

echo "All Tasks in Exam:\n";
foreach ($tasks as $t) {
    echo "ID: {$t->id} | Skill: {$t->skill_type} | Title: {$t->title}\n";
    $ans = \App\Domains\Academic\Domain\Models\PtIeltsAnswer::where('pt_session_id', $latestSession->id)
        ->where('pt_ielts_task_id', $t->id)
        ->first();
    if ($ans) {
        echo "  -> Has answer in DB! Band: {$ans->band_score} | Notes: {$ans->teacher_notes}\n";
    } else {
        echo "  -> NO ANSWER in DB for this task!\n";
    }
}
