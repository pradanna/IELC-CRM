<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_templates', function (Blueprint $table) {
            // Drop old structure
            $table->dropForeign(['lead_phase_id']);
            $table->dropForeign(['lead_type_id']);
            $table->dropColumn(['target_type', 'lead_phase_id', 'lead_type_id', 'file_path', 'file_name']);
        });

        // Create pivot table for Lead Phases
        Schema::create('chat_template_lead_phase', function (Blueprint $table) {
            $table->id();
            $table->uuid('chat_template_id');
            $table->uuid('lead_phase_id');
            $table->timestamps();

            $table->foreign('chat_template_id')->references('id')->on('chat_templates')->cascadeOnDelete();
            $table->foreign('lead_phase_id')->references('id')->on('lead_phases')->cascadeOnDelete();
            
            $table->unique(['chat_template_id', 'lead_phase_id'], 'ct_lp_unique');
        });

        // Create pivot table for Lead Types
        Schema::create('chat_template_lead_type', function (Blueprint $table) {
            $table->id();
            $table->uuid('chat_template_id');
            $table->uuid('lead_type_id');
            $table->timestamps();

            $table->foreign('chat_template_id')->references('id')->on('chat_templates')->cascadeOnDelete();
            $table->foreign('lead_type_id')->references('id')->on('lead_types')->cascadeOnDelete();
            
            $table->unique(['chat_template_id', 'lead_type_id'], 'ct_lt_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_template_lead_type');
        Schema::dropIfExists('chat_template_lead_phase');

        Schema::table('chat_templates', function (Blueprint $table) {
            $table->string('target_type')->default('global');
            $table->uuid('lead_phase_id')->nullable();
            $table->uuid('lead_type_id')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();

            $table->foreign('lead_phase_id')->references('id')->on('lead_phases')->nullOnDelete();
            $table->foreign('lead_type_id')->references('id')->on('lead_types')->nullOnDelete();
        });
    }
};
