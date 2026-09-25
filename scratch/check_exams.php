<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach (\App\Domains\Academic\Domain\Models\PtExam::all() as $exam) {
    $qCount = $exam->questions()->count();
    $optCount = \App\Domains\Academic\Domain\Models\PtQuestionOption::whereHas('ptQuestion', function($q) use ($exam) {
        $q->where('pt_exam_id', $exam->id);
    })->where('is_correct', true)->count();
    
    $genQCount = $exam->generalQuestions()->count();
    $genOptCount = \App\Domains\Academic\Domain\Models\PtGeneralQuestionOption::whereHas('ptGeneralQuestion', function($q) use ($exam) {
        $q->where('pt_exam_id', $exam->id);
    })->where('is_correct', true)->count();
    
    echo "Exam: {$exam->title} ({$exam->slug})\n";
    echo "  PtQuestions: {$qCount}, Correct Options: {$optCount}\n";
    echo "  PtGeneralQuestions: {$genQCount}, Correct Gen Options: {$genOptCount}\n";
    echo "  PtIeltsTasks: " . $exam->ieltsTasks()->count() . "\n";
}
