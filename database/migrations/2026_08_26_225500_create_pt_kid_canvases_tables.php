<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Dedicated canvas tables for Kids Placement Tests without modifying existing PT tables.
     */
    public function up(): void
    {
        // 1. Dedicated Canvas Configuration per Question
        Schema::create('pt_kid_canvases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pt_question_id')->unique()->constrained('pt_questions')->cascadeOnDelete();
            $table->string('mode')->default('freeform_canvas'); // freeform_canvas, image_pin
            $table->text('instruction')->nullable();
            $table->longText('canvas_data'); // Stores full JSON of elements, targets, tokens
            $table->timestamps();
        });

        // 2. Dedicated Canvas Student Answers
        Schema::create('pt_kid_canvas_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pt_session_id')->constrained('pt_sessions')->cascadeOnDelete();
            $table->foreignUuid('pt_question_id')->constrained('pt_questions')->cascadeOnDelete();
            $table->foreignUuid('pt_kid_canvas_id')->nullable()->constrained('pt_kid_canvases')->nullOnDelete();
            $table->longText('user_mapping')->nullable(); // JSON map of target_id => token_id
            $table->boolean('is_correct')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pt_kid_canvas_answers');
        Schema::dropIfExists('pt_kid_canvases');
    }
};
