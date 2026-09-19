<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$task = \App\Domains\Academic\Domain\Models\PtIeltsTask::where('skill_type', 'listening')->first();
echo "audio_path in DB: " . $task->audio_path . PHP_EOL;
echo "Storage URL: " . \Illuminate\Support\Facades\Storage::url($task->audio_path) . PHP_EOL;
echo "File exists on disk: " . (file_exists(storage_path('app/public/' . $task->audio_path)) ? 'YES' : 'NO') . PHP_EOL;
