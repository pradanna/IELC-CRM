<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$notifs = DB::table('notifications')->orderBy('created_at', 'desc')->limit(5)->get();
foreach ($notifs as $n) {
    echo "ID: " . $n->id . "\n";
    echo "Type: " . $n->type . "\n";
    echo "Notifiable: " . $n->notifiable_type . " (" . $n->notifiable_id . ")\n";
    echo "Data: " . $n->data . "\n";
    echo "Created At: " . $n->created_at . "\n";
    echo "-------------------\n";
}
