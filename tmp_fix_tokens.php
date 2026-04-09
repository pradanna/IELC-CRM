<?php
// Bootstrap Laravel
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Lead;
use Illuminate\Support\Str;

$count = 0;
Lead::whereNull('self_registration_token')->get()->each(function($l) use (&$count) {
    if (!$l->self_registration_token) {
        $l->self_registration_token = (string) Str::uuid();
        $l->save();
        $count++;
    }
});

echo "Misi Selesai: $count Lead lunas diperkaya dengan Token!";
