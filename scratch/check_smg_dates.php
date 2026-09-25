<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\Master\Domain\Models\Branch;

$smg = Branch::where('code', 'SMG')->first();
if ($smg) {
    $smgLeads = Lead::where('branch_id', $smg->id)->get();
    echo "Semarang Branch Leads count: " . $smgLeads->count() . "\n";
    foreach ($smgLeads as $l) {
        $e = LeadEnrollment::where('lead_id', $l->id)->first();
        echo "  - Lead: {$l->name} | City: {$l->city} | Joined: {$e?->joined_at?->toDateString()}\n";
    }
} else {
    echo "Semarang branch not found!\n";
}
