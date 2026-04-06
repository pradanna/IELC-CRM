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
        Schema::create('lead_relationships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignUuid('related_lead_id')->constrained('leads')->cascadeOnDelete();
            $table->enum('type', ['sibling', 'parent', 'child', 'guardian'])->default('sibling');
            $table->boolean('is_main_contact')->default(false);
            $table->timestamps();

            $table->index(['lead_id', 'related_lead_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lead_relationships');
    }
};
