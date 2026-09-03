<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Domains\CRM\Domain\Models\LeadEnrollment;
use Carbon\Carbon;

$now = Carbon::now();
$start = $now->copy()->startOfMonth();
$end = $now->copy()->endOfMonth();

echo "Current month range: {$start->toDateString()} to {$end->toDateString()}\n";

$enrollments = LeadEnrollment::with(['lead', 'studyClass'])
    ->whereBetween('joined_at', [$start, $end])
    ->get();

echo "Total enrollments in current month ({$now->format('F Y')}): " . $enrollments->count() . "\n";

$onlineCount = 0;
$offlineCount = 0;

foreach ($enrollments as $e) {
    $classType = $e->studyClass?->type;
    $leadOnline = $e->lead?->is_online;
    $isOnline = ($e->studyClass ? ($classType === 'online') : (bool)$leadOnline);
    if ($isOnline) {
        $onlineCount++;
    } else {
        $offlineCount++;
    }
}

echo "Current Month Online Enrolled: {$onlineCount}\n";
echo "Current Month Offline Enrolled: {$offlineCount}\n";

echo "\n--- Scanning ALL Enrollments ---\n";
$allEnrollments = LeadEnrollment::with(['lead', 'studyClass'])->get();
$allOnline = 0;
$allOffline = 0;
$months = [];

foreach ($allEnrollments as $e) {
    $classType = $e->studyClass?->type;
    $leadOnline = $e->lead?->is_online;
    $isOnline = ($e->studyClass ? ($classType === 'online') : (bool)$leadOnline);
    $monthKey = Carbon::parse($e->joined_at)->format('Y-m');
    
    if ($isOnline) {
        $allOnline++;
        $months[$monthKey]['online'] = ($months[$monthKey]['online'] ?? 0) + 1;
    } else {
        $allOffline++;
        $months[$monthKey]['offline'] = ($months[$monthKey]['offline'] ?? 0) + 1;
    }
}

echo "Total All Enrollments: " . $allEnrollments->count() . "\n";
echo "Total All Online: {$allOnline}\n";
echo "Total All Offline: {$allOffline}\n";

echo "\nBreakdown by Month (joined_at):\n";
ksort($months);
print_r($months);
