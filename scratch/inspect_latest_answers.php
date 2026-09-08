<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$latestSession = \App\Domains\Academic\Domain\Models\PtSession::latest()->first();
echo "Latest Session ID: " . $latestSession->id . " | Token: " . $latestSession->token . PHP_EOL;
echo "Final Score: " . var_export($latestSession->final_score, true) . " | Is Graded: " . var_export($latestSession->is_graded, true) . " | Status: " . $latestSession->status . PHP_EOL;

$kidsExam = \App\Domains\Academic\Domain\Models\PtExam::where('category', 'Kids')->first();
if ($kidsExam) {
    echo "Kids Exam: " . $kidsExam->title . " | ID=" . $kidsExam->id . PHP_EOL;
    $kidsExam->load(['kidsQuestions', 'questions']);
    echo "kidsQuestions rel count: " . $kidsExam->kidsQuestions->count() . PHP_EOL;
    echo "questions rel count: " . $kidsExam->questions->count() . PHP_EOL;
    if ($kidsExam->kidsQuestions->isNotEmpty()) {
        $kq = $kidsExam->kidsQuestions->first();
        echo "First kidsQuestion ID=" . $kq->id . PHP_EOL;
    }
    if ($kidsExam->questions->isNotEmpty()) {
        $q = $kidsExam->questions->first();
        echo "First question ID=" . $q->id . " | type=" . $q->type . " | class=" . get_class($q) . PHP_EOL;
        $q->load(['kidCanvas', 'options']);
        echo "kidCanvas: " . ($q->kidCanvas ? 'exists' : 'null') . PHP_EOL;
        echo "options count: " . $q->options->count() . PHP_EOL;
        if ($q->options->isNotEmpty()) {
            echo "first option text length: " . strlen($q->options->first()->option_text ?? '') . PHP_EOL;
        }
    }

} else {
    echo "No Kids Exam found!" . PHP_EOL;
}

$allSessions = \App\Domains\Academic\Domain\Models\PtSession::whereHas('ptExam', function($q) {
    $q->where('category', 'Kids');
})->latest()->take(3)->get();
echo "Kids Sessions count: " . $allSessions->count() . PHP_EOL;
foreach ($allSessions as $s) {
    echo "Session {$s->id} | token={$s->token} | final_score={$s->final_score} | status={$s->status}" . PHP_EOL;
    $answers = \App\Domains\Academic\Domain\Models\PtKidsAnswer::where('pt_session_id', $s->id)->get();
    echo "Answers in db: " . $answers->count() . PHP_EOL;
}


