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
        Schema::create('class_attendances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('study_class_id')->constrained('study_classes')->cascadeOnDelete();
            $table->foreignUuid('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->foreignUuid('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('cycle_number')->default(1);
            $table->unsignedInteger('session_number');
            $table->date('attendance_date');
            $table->enum('status', ['present', 'sick', 'permission', 'absent'])->default('present');
            $table->string('topic')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['study_class_id', 'cycle_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_attendances');
    }
};
