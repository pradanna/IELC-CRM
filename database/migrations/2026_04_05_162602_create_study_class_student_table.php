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
        Schema::create('study_class_student', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('study_class_id')->constrained('study_classes')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->unsignedInteger('cycle_number')->default(1);
            $table->timestamps();

            $table->index(['study_class_id', 'student_id', 'cycle_number'], 'idx_study_class_student_cycle');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('study_class_student');
    }
};
