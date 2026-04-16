<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Lead;
use Carbon\Carbon;

$user = User::has('superadmin')->first();

if (!$user) {
    echo "No Superadmin found\n";
    $user = User::first();
}

echo "User ID: " . $user->id . "\n";
echo "Is Superadmin: " . ($user->superadmin ? "Yes" : "No") . "\n";

$date = '2026-04-15';
$start = Carbon::parse($date)->startOfDay();
$end = Carbon::parse($date)->endOfDay();

echo "Range Start: " . $start . "\n";
echo "Range End  : " . $end . "\n";

$leads = Lead::whereBetween('created_at', [$start, $end])->get();
echo "Leads count: " . $leads->count() . "\n";

foreach ($leads as $l) {
    echo "- Name: " . $l->name . "\n";
    echo "  Created: " . $l->created_at . "\n";
    echo "  Owner: " . ($l->owner_id ?? 'NULL') . "\n";
    echo "  Branch: " . ($l->branch_id ?? 'NULL') . "\n";
}
