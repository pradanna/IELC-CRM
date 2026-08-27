<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Dedicated tables for General Placement Test (MCQ & Text answers).
     */
    public function up(): void
    {
        // 1. Question Groups / Passages
        Schema::create('pt_general_question_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pt_exam_id')->constrained('pt_exams')->cascadeOnDelete();
            $table->text('instruction')->nullable();
            $table->text('reading_text')->nullable();
            $table->string('audio_path')->nullable();
            $table->string('file_path')->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        // 2. Questions
        Schema::create('pt_general_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pt_exam_id')->constrained('pt_exams')->cascadeOnDelete();
            $table->foreignUuid('pt_general_question_group_id')->nullable()->constrained('pt_general_question_groups')->nullOnDelete();
            $table->integer('number')->nullable();
            $table->string('type')->default('mcq'); // mcq, text, boolean
            $table->text('question_text');
            $table->string('audio_path')->nullable();
            $table->integer('points')->default(1);
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        // 3. Question Options (for MCQ)
        Schema::create('pt_general_question_options', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pt_general_question_id')->constrained('pt_general_questions')->cascadeOnDelete();
            $table->string('option_text');
            $table->boolean('is_correct')->default(false);
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        // 4. Student Answers
        Schema::create('pt_general_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pt_session_id')->constrained('pt_sessions')->cascadeOnDelete();
            $table->foreignUuid('pt_general_question_id')->constrained('pt_general_questions')->cascadeOnDelete();
            $table->foreignUuid('pt_general_question_option_id')->nullable()->constrained('pt_general_question_options')->nullOnDelete();
            $table->text('answer_text')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->integer('score_earned')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pt_general_answers');
        Schema::dropIfExists('pt_general_question_options');
        Schema::dropIfExists('pt_general_questions');
        Schema::dropIfExists('pt_general_question_groups');
    }
};
