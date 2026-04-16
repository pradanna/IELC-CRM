<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pt_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pt_exam_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('pt_question_group_id')->nullable()->constrained('pt_question_groups')->nullOnDelete();
            $table->integer('number')->nullable();
            $table->string('type')->default('mcq'); // mcq, text, file
            $table->text('question_text');
            $table->string('audio_path')->nullable();
            $table->integer('points')->default(1);
            $table->integer('position')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pt_questions');
    }
};
