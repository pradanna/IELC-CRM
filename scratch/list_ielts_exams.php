<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$exams = \App\Domains\Academic\Domain\Models\PtExam::where('category', 'IELTS')->get();
foreach ($exams as $e) {
    echo "Exam: {$e->title} (ID: {$e->id}, Slug: {$e->slug})\n";
    foreach ($e->ieltsTasks as $t) {
        echo "  - [{$t->skill_type}] {$t->title}\n";
        echo "    Audio: {$t->audio_path}\n";
    }
}
