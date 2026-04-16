<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Lead;
use Carbon\Carbon;

$user = User::where('name', 'Super Admin')->first() ?? User::first();

echo "Testing for User ID: " . $user->id . "\n";
echo "Name: " . $user->name . "\n";
echo "Has superadmin() relation: " . ($user->superadmin()->exists() ? "Yes" : "No") . "\n";
echo "Has superadmin property: " . ($user->superadmin ? "Yes" : "No") . "\n";
echo "Marketing: " . ($user->marketing()->exists() ? "Yes" : "No") . "\n";
echo "Frontdesk: " . ($user->frontdesk()->exists() ? "Yes" : "No") . "\n";

$date = '2026-04-15';
$start = Carbon::parse($date)->startOfDay();
$end = Carbon::parse($date)->endOfDay();

$leadsToday = Lead::whereBetween('created_at', [$start, $end])->get();
echo "Leads created today: " . $leadsToday->count() . "\n";

foreach ($leadsToday as $l) {
    echo "- Lead: " . $l->name . " (ID: " . $l->id . ")\n";
    echo "  Owner ID: " . ($l->owner_id ?? 'NULL') . "\n";
    echo "  Created At: " . $l->created_at . " (UTC: " . $l->created_at->toIso8601String() . ")\n";
}
