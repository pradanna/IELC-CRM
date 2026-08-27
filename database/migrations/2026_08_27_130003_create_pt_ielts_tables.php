<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Streamlined tables for IELTS Placement Diagnostic (Tasks & Answers).
     */
    public function up(): void
    {
        // 1. IELTS Tasks (Listening, Reading, Writing, Speaking)
        Schema::create('pt_ielts_tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pt_exam_id')->constrained('pt_exams')->cascadeOnDelete();
            $table->string('skill_type')->default('writing'); // listening, reading, writing, speaking
            $table->string('title');
            $table->text('description')->nullable(); // Instructions or speaking prompts
            $table->string('audio_path')->nullable(); // Audio file for Listening
            $table->string('question_pdf_path')->nullable(); // Question Book PDF (Listening, Reading, Writing)
            $table->string('answer_sheet_pdf_path')->nullable(); // Template Answer Sheet PDF (Listening, Reading)
            $table->integer('min_words')->nullable(); // Word count guidance (Writing Task 1 & 2)
            $table->integer('duration_minutes')->nullable();
            $table->decimal('max_score', 3, 1)->default(9.0);
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        // 2. IELTS Answers & Teacher Evaluation
        Schema::create('pt_ielts_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pt_session_id')->constrained('pt_sessions')->cascadeOnDelete();
            $table->foreignUuid('pt_ielts_task_id')->constrained('pt_ielts_tasks')->cascadeOnDelete();
            
            // Student submission (can be uploaded filled PDF/file, written essay text, or both)
            $table->string('answer_file_path')->nullable(); // Uploaded filled PDF or scanned answer sheet
            $table->longText('essay_text')->nullable(); // Online typed text / essay response
            
            // Teacher Assessment & Band Criteria (Scale 0.0 - 9.0)
            $table->decimal('score_tr', 3, 1)->nullable(); // Task Response / Achievement
            $table->decimal('score_cc', 3, 1)->nullable(); // Coherence & Cohesion
            $table->decimal('score_lr', 3, 1)->nullable(); // Lexical Resource
            $table->decimal('score_gra', 3, 1)->nullable(); // Grammatical Range & Accuracy
            $table->decimal('band_score', 3, 1)->nullable(); // Overall Task Band Score
            
            $table->text('teacher_notes')->nullable(); // Teacher evaluator feedback
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pt_ielts_answers');
        Schema::dropIfExists('pt_ielts_tasks');
    }
};