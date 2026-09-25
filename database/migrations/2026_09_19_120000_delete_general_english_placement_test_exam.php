<?php

use Illuminate\Database\Migrations\Migration;
use App\Domains\Academic\Domain\Models\PtExam;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Find and delete the obsolete dummy General English Placement Test
        $exams = PtExam::where('title', 'General English Placement Test')
            ->orWhere('slug', 'general-english-placement-test')
            ->orWhere('slug', 'general-pt')
            ->get();

        foreach ($exams as $exam) {
            // Delete questions and question groups (and their options)
            foreach ($exam->questions as $question) {
                $question->options()->delete();
                $question->delete();
            }
            $exam->ptQuestionGroups()->delete();
            $exam->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Irreversible cleanup of obsolete legacy seeder
    }
};
