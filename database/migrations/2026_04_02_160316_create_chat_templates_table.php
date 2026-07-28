<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('message');
            $table->timestamps();
        });

        Schema::create('chat_template_lead_phase', function (Blueprint $table) {
            $table->id();
            $table->uuid('chat_template_id');
            $table->uuid('lead_phase_id');
            $table->timestamps();

            $table->foreign('chat_template_id')->references('id')->on('chat_templates')->cascadeOnDelete();
            $table->foreign('lead_phase_id')->references('id')->on('lead_phases')->cascadeOnDelete();
            
            $table->unique(['chat_template_id', 'lead_phase_id'], 'ct_lp_unique');
        });

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
        Schema::dropIfExists('chat_templates');
    }
};
