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
        Schema::create('branch_monthly_student_snapshots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');
            $table->integer('group_count')->default(0);
            $table->integer('private_count')->default(0);
            $table->integer('ielts_count')->default(0);
            $table->integer('toefl_count')->default(0);
            $table->integer('total_active_count')->default(0);
            $table->integer('inactive_count')->default(0);
            $table->integer('total_students_count')->default(0);
            $table->timestamps();

            $table->unique(['branch_id', 'year', 'month'], 'branch_year_month_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branch_monthly_student_snapshots');
    }
};
