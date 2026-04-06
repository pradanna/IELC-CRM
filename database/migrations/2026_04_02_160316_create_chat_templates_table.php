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
        Schema::create('chat_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('message');
            $table->string('target_type')->default('global'); // 'global', 'lead_phase', 'lead_type'
            
            $table->uuid('lead_phase_id')->nullable();
            $table->foreign('lead_phase_id')->references('id')->on('lead_phases')->nullOnDelete();
            
            $table->uuid('lead_type_id')->nullable();
            $table->foreign('lead_type_id')->references('id')->on('lead_types')->nullOnDelete();
            
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_templates');
    }
};
