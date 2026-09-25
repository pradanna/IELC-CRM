<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$exam = \App\Domains\Academic\Domain\Models\PtExam::where('category', 'Kids')->first();
$totalTargets = 0;
foreach ($exam->questions()->with('kidCanvas')->get() as $idx => $q) {
    $c = $q->kidCanvas?->canvas_data;
    $count = 0;
    if (isset($c['targets']) && is_array($c['targets'])) {
        foreach ($c['targets'] as $t) {
            $isEx = !empty($t['is_example']) || in_array($t['type'] ?? '', ['example_circle', 'example_box', 'example_word', 'example_input']);
            if ($isEx) continue;
            if (($t['type'] ?? '') === 'ring_target' && ($t['is_correct_answer'] ?? true) === false) continue;
            $count++;
        }
    } elseif (isset($c['drop_zones']) && is_array($c['drop_zones'])) {
        $count = count($c['drop_zones']);
    }
    echo "Q #{$q->number} (id: {$q->id}): {$count} targets (points: {$q->points})" . PHP_EOL;
    $totalTargets += $count;
}
echo "=== TOTAL TARGETS: {$totalTargets} ===" . PHP_EOL;
