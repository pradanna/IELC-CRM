<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cols = \Illuminate\Support\Facades\Schema::getColumnListing('pt_kids_answers');
echo "Columns in pt_kids_answers: " . implode(', ', $cols) . PHP_EOL;

$exam = \App\Domains\Academic\Domain\Models\PtExam::where('category', 'Kids')->first();
echo "Kids Exam: " . $exam->title . PHP_EOL;
echo "pt_kids_questions count for this exam: " . $exam->kidsQuestions()->count() . PHP_EOL;
echo "pt_questions count for this exam: " . $exam->questions()->count() . PHP_EOL;
