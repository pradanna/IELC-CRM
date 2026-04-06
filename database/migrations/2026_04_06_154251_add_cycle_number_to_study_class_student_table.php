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
        Schema::table('study_class_student', function (Blueprint $table) {
            $table->unsignedInteger('cycle_number')->default(1)->after('student_id');
            $table->index(['study_class_id', 'student_id', 'cycle_number'], 'idx_study_class_student_cycle');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('study_class_student', function (Blueprint $table) {
            $table->dropIndex('idx_study_class_student_cycle');
            $table->dropColumn('cycle_number');
        });
    }
};
