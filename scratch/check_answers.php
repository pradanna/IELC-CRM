<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = ['pt_answers', 'pt_general_answers', 'pt_kids_answers', 'pt_ielts_answers', 'pt_kid_canvas_answers'];
foreach ($tables as $t) {
    echo "$t: " . \DB::table($t)->count() . PHP_EOL;
}

$latestKidsSession = \App\Domains\Academic\Domain\Models\PtSession::whereHas('ptExam', fn($q) => $q->where('category', 'Kids'))->latest()->first();
if ($latestKidsSession) {
    echo "Latest Kids Session: " . $latestKidsSession->id . " | token: " . $latestKidsSession->token . PHP_EOL;
    foreach ($tables as $t) {
        $cnt = \DB::table($t)->where('pt_session_id', $latestKidsSession->id)->count();
        if ($cnt > 0) {
            echo " -> found in $t: $cnt" . PHP_EOL;
            print_r(\DB::table($t)->where('pt_session_id', $latestKidsSession->id)->get()->toArray());
        }
    }
}
