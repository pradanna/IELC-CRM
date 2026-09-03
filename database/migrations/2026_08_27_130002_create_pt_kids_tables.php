<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Dedicated tables for Kids Placement Test (Interactive Canvas, Pin, Token, and Answers).
     */
    public function up(): void
    {
        // 1. Kids Question Groups / Sections
        Schema::create('pt_kids_question_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pt_exam_id')->constrained('pt_exams')->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->text('instruction')->nullable();
            $table->string('theme_color')->nullable(); // e.g. 'amber', 'sky', 'emerald'
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        // 2. Kids Questions (Canvas, Drag & Drop, Pin)
        Schema::create('pt_kids_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pt_exam_id')->constrained('pt_exams')->cascadeOnDelete();
            $table->foreignUuid('pt_kids_question_group_id')->nullable()->constrained('pt_kids_question_groups')->nullOnDelete();
            $table->integer('number')->nullable();
            $table->string('mode')->default('freeform_canvas'); // freeform_canvas, image_pin, match_line
            $table->text('instruction')->nullable();
            $table->string('audio_path')->nullable();
            $table->longText('canvas_data'); // JSON layout, targets, tokens, background image
            $table->integer('points')->default(1);
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        // 3. Kids Student Answers & Grading
        Schema::create('pt_kids_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pt_session_id')->constrained('pt_sessions')->cascadeOnDelete();
            $table->foreignUuid('pt_kids_question_id')->constrained('pt_kids_questions')->cascadeOnDelete();
            $table->longText('user_mapping')->nullable(); // JSON of target_id => token_id
            $table->boolean('is_correct')->default(false);
            $table->integer('score_earned')->default(0);
            $table->text('teacher_notes')->nullable(); // Teacher/Evaluator observation note
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pt_kids_answers');
        Schema::dropIfExists('pt_kids_questions');
        Schema::dropIfExists('pt_kids_question_groups');
    }
};
