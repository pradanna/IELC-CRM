<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$colsKids = \Illuminate\Support\Facades\Schema::getColumnListing('pt_kids_questions');
echo "pt_kids_questions columns: " . implode(', ', $colsKids) . PHP_EOL;

$exam = \App\Domains\Academic\Domain\Models\PtExam::where('category', 'Kids')->first();
$questions = $exam->questions()->with('kidCanvas')->get();
echo "Questions count: " . $questions->count() . PHP_EOL;
foreach ($questions->take(3) as $q) {
    echo "ID: " . $q->id . " | text: " . $q->question_text . " | canvas exists: " . ($q->kidCanvas ? 'yes' : 'no') . PHP_EOL;
    if ($q->kidCanvas) {
        $cdata = $q->kidCanvas->canvas_data;
        echo "Canvas mode: " . ($cdata['mode'] ?? 'null') . " | targets: " . count($cdata['targets'] ?? []) . " | tokens: " . count($cdata['tokens'] ?? []) . PHP_EOL;
    }
}
