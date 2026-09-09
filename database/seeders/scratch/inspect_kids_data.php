<?php
// Script to inspect existing Kids PT data
require __DIR__ . '/../../../vendor/autoload.php';

$app = require __DIR__ . '/../../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Domains\Academic\Domain\Models\PtKidCanvas;
use App\Domains\Academic\Domain\Models\PtQuestion;
use App\Domains\Academic\Domain\Models\PtExam;

// Show all Kids exams
$exams = PtExam::where('category', 'Kids')->get();
echo "=== KIDS EXAMS ===\n";
foreach ($exams as $exam) {
    echo "ID: {$exam->id} | Title: {$exam->title} | Slug: {$exam->slug}\n";
}

// Show all questions
echo "\n=== QUESTIONS ===\n";
$questions = PtQuestion::whereHas('ptExam', function($q) { $q->where('category', 'Kids'); })->orderBy('position')->get();
foreach ($questions as $q) {
    echo "ID: {$q->id} | Pos: {$q->position} | Text: {$q->question_text} | Type: {$q->type}\n";
}

// Show canvas data summaries
echo "\n=== CANVASES ===\n";
$canvases = PtKidCanvas::all();
foreach ($canvases as $c) {
    $data = $c->canvas_data;
    $imgCount = 0;
    $tokenCount = 0;
    $targetCount = 0;
    $elementCount = 0;
    
    if (is_array($data)) {
        $tokenCount = count($data['tokens'] ?? []);
        $targetCount = count($data['targets'] ?? []);
        $elementCount = count($data['elements'] ?? []);
        
        foreach (($data['elements'] ?? []) as $el) {
            if (($el['type'] ?? '') === 'image') {
                $imgCount++;
                // Show short version of src
                $src = $el['src'] ?? '';
                if (str_starts_with($src, 'http')) {
                    echo "  -> IMG URL: $src\n";
                } elseif (str_starts_with($src, 'data:')) {
                    echo "  -> IMG base64 (truncated)\n";
                }
            }
        }
    }
    
    echo "Canvas ID: {$c->id} | Q_ID: {$c->pt_question_id} | Mode: {$c->mode}\n";
    echo "  Tokens: $tokenCount | Targets: $targetCount | Elements: $elementCount (images: $imgCount)\n";
}

// List storage images
echo "\n=== STORAGE IMAGES (kids_canvas) ===\n";
$storageDir = storage_path('app/public/pt_exams/kids_canvas');
if (is_dir($storageDir)) {
    $files = scandir($storageDir);
    foreach ($files as $f) {
        if ($f !== '.' && $f !== '..') {
            $size = filesize("$storageDir/$f");
            echo "  $f (" . round($size/1024, 1) . " KB)\n";
        }
    }
} else {
    echo "  Directory not found: $storageDir\n";
}
