<?php
// Script to export existing Kids PT canvas data as JSON for seeding
require __DIR__ . '/../../../vendor/autoload.php';

$app = require __DIR__ . '/../../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Domains\Academic\Domain\Models\PtKidCanvas;
use App\Domains\Academic\Domain\Models\PtQuestion;
use App\Domains\Academic\Domain\Models\PtExam;

$exam = PtExam::where('category', 'Kids')->first();
$questions = PtQuestion::whereHas('ptExam', function($q) { $q->where('category', 'Kids'); })
    ->with('kidCanvas')
    ->orderBy('position')
    ->get();

$output = [
    'exam_title' => $exam->title,
    'exam_slug'  => $exam->slug,
    'exam_description' => $exam->description,
    'exam_duration' => $exam->duration_minutes,
    'questions' => [],
];

foreach ($questions as $q) {
    $canvas = $q->kidCanvas;
    $output['questions'][] = [
        'question_text' => $q->question_text,
        'type'          => $q->type,
        'points'        => $q->points,
        'number'        => $q->number,
        'position'      => $q->position,
        'audio_path'    => $q->audio_path,
        'canvas' => [
            'mode'        => $canvas?->mode,
            'instruction' => $canvas?->instruction,
            'canvas_data' => $canvas?->canvas_data,
        ],
    ];
}

$json = json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
$outPath = __DIR__ . '/kids_pt_export.json';
file_put_contents($outPath, $json);

echo "Exported " . count($output['questions']) . " questions to: $outPath\n";
echo "File size: " . round(filesize($outPath)/1024, 1) . " KB\n";

// Also print summary without base64
foreach ($output['questions'] as $qi => $qd) {
    echo "\n--- Question " . ($qi+1) . ": {$qd['question_text']} ---\n";
    $cd = $qd['canvas']['canvas_data'];
    $tokens = $cd['tokens'] ?? [];
    $targets = $cd['targets'] ?? [];
    $elements = $cd['elements'] ?? [];
    
    echo "  Tokens (" . count($tokens) . "): " . implode(', ', array_column($tokens, 'text')) . "\n";
    echo "  Elements (" . count($elements) . "):\n";
    foreach ($elements as $el) {
        $type = $el['type'] ?? 'unknown';
        if ($type === 'image') {
            $src = $el['src'] ?? '';
            $shortSrc = str_starts_with($src, 'data:') ? '[base64 image]' : $src;
            echo "    - image: x={$el['x']}, y={$el['y']}, src=$shortSrc\n";
        } elseif ($type === 'text') {
            echo "    - text: '{$el['text']}' x={$el['x']}, y={$el['y']}\n";
        }
    }
    echo "  Targets (" . count($targets) . "):\n";
    foreach ($targets as $t) {
        $ttype = $t['type'] ?? 'unknown';
        $correctId = $t['correct_token_ids'][0] ?? $t['correct_token_id'] ?? 'none';
        echo "    - {$ttype}: x={$t['x']}, y={$t['y']} correct=$correctId\n";
    }
}
