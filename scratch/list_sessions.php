<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sessions = \App\Domains\Academic\Domain\Models\PtSession::latest()->take(5)->get();
foreach ($sessions as $s) {
    echo "Session: " . $s->session_token . " | Exam: " . ($s->ptExam?->title ?? 'None') . " (ID: " . $s->pt_exam_id . ") | Status: " . $s->status . " | Created: " . $s->created_at . PHP_EOL;
}
