<?php
// Script to prepare seeder data:
// 1. Copy images used in canvas to seeder assets
// 2. Export canvas data to JSON (with URL references, not base64)
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

$storageBase = storage_path('app/public');
$assetDest = __DIR__ . '/../assets/pt_exams/kids_canvas';

// Ensure destination exists
if (!is_dir($assetDest)) {
    mkdir($assetDest, 0755, true);
}

$output = [
    'exam_title'       => $exam->title,
    'exam_slug'        => $exam->slug,
    'exam_description' => $exam->description,
    'exam_duration'    => $exam->duration_minutes,
    'questions'        => [],
];

$copiedImages = [];

foreach ($questions as $q) {
    $canvas = $q->kidCanvas;
    $canvasData = $canvas?->canvas_data;

    // Replace base64 image src with URL path and copy files
    if (is_array($canvasData) && isset($canvasData['elements'])) {
        foreach ($canvasData['elements'] as &$el) {
            if (($el['type'] ?? '') === 'image') {
                $src = $el['src'] ?? '';
                
                if (str_starts_with($src, '/storage/')) {
                    // Already a URL - ensure file is copied to assets
                    $relativePath = substr($src, strlen('/storage/'));
                    $sourceFile = $storageBase . '/' . $relativePath;
                    $filename = basename($relativePath);
                    $destFile = $assetDest . '/' . $filename;
                    
                    if (file_exists($sourceFile) && !file_exists($destFile)) {
                        copy($sourceFile, $destFile);
                        $copiedImages[] = $filename;
                        echo "Copied: $filename\n";
                    } elseif (file_exists($destFile)) {
                        echo "Already exists: $filename\n";
                    } else {
                        echo "WARNING: Source not found: $sourceFile\n";
                    }
                    
                    // Keep the URL reference (seeder will reconstruct the URL)
                    $el['src'] = '/storage/pt_exams/kids_canvas/' . $filename;
                } elseif (str_starts_with($src, 'data:')) {
                    echo "WARNING: base64 image found in Q: {$q->question_text}\n";
                }
            }
        }
        unset($el);
    }

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
            'canvas_data' => $canvasData,
        ],
    ];
}

// Copy ALL remaining images in storage kids_canvas to assets (so none are missing)
$storageKidsDir = $storageBase . '/pt_exams/kids_canvas';
$allStorageImages = glob($storageKidsDir . '/*.{jpg,jpeg,png,gif,webp}', GLOB_BRACE);
echo "\n--- Syncing ALL images from storage to seeder assets ---\n";
foreach ($allStorageImages as $imgFile) {
    $filename = basename($imgFile);
    $destFile = $assetDest . '/' . $filename;
    if (!file_exists($destFile)) {
        copy($imgFile, $destFile);
        echo "Synced: $filename\n";
    }
}

// Write JSON
$outPath = __DIR__ . '/../data/kids_pt_questions.json';
file_put_contents($outPath, json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
echo "\nExported " . count($output['questions']) . " questions to: $outPath\n";
echo "File size: " . round(filesize($outPath)/1024, 1) . " KB\n";

// Count assets
$assetFiles = glob($assetDest . '/*.{jpg,jpeg,png,gif,webp}', GLOB_BRACE);
echo "Total images in seeder assets: " . count($assetFiles) . "\n";
