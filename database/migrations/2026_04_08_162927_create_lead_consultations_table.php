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
        Schema::create('lead_consultations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained(); // Consultant
            $table->date('consultation_date');
            $table->text('notes')->nullable();
            $table->string('recommended_level')->nullable();
            $table->text('follow_up_note')->nullable();
            $table->json('metadata')->nullable(); // To store templates sent, etc.
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lead_consultations');
    }
};
