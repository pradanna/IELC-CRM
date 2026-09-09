<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\Master\Domain\Models\Branch;

$smg = Branch::where('code', 'SMG')->first();
$solo = Branch::where('code', 'SOLO')->first();

echo "SMG Branch ID: {$smg?->id}\n";

$smgEnrollments = LeadEnrollment::with(['lead.branch', 'studyClass'])
    ->whereHas('lead', fn($q) => $q->where('branch_id', $smg?->id))
    ->get();

echo "Total LeadEnrollments with lead.branch_id = SMG: " . $smgEnrollments->count() . "\n";

foreach ($smgEnrollments as $e) {
    echo "  - Lead: {$e->lead?->name} | Lead Branch: {$e->lead?->branch?->code} | Joined At: {$e->joined_at?->toDateString()} | StudyClass: {$e->studyClass?->name}\n";
}
