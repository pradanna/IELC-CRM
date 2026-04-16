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
        Schema::create('study_classes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignUuid('instructor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('price_master_id')->nullable()->constrained('price_masters')->nullOnDelete();
            $table->string('name');
            $table->date('start_session_date')->nullable();
            $table->date('end_session_date')->nullable();
            $table->unsignedInteger('total_meetings')->default(12);
            $table->unsignedInteger('meetings_per_week')->default(2);
            $table->unsignedInteger('current_session_number')->default(1);
            $table->string('schedule_days')->nullable(); 
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('study_classes');
    }
};
