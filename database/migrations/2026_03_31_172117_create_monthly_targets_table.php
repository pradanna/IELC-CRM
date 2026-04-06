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
        Schema::create('monthly_targets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            
            $table->unsignedInteger('year');
            $table->unsignedTinyInteger('month'); // 1-12
            $table->unsignedInteger('target_enrolled')->default(0);
            
            $table->timestamps();

            // Ensure unique target per branch per month
            $table->unique(['branch_id', 'year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_targets');
    }
};
