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
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->string('student_number')->unique();
            $table->string('profile_picture')->nullable();
            $table->date('start_join');
            $table->enum('status', ['active', 'stop', 'rejoin'])->default('active');
            $table->timestamp('stopped_at')->nullable();
            $table->unsignedInteger('rejoin_count')->default(0);
            $table->string('loyalty_tier')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
