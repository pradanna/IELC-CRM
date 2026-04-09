<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_chat_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('lead_id');
            $table->uuid('chat_template_id')->nullable();
            $table->uuid('lead_phase_id');
            $table->uuid('user_id'); // UUID to match User model
            $table->text('message'); 
            $table->timestamps();

            $table->foreign('lead_id')->references('id')->on('leads')->cascadeOnDelete();
            $table->foreign('chat_template_id')->references('id')->on('chat_templates')->nullOnDelete();
            $table->foreign('lead_phase_id')->references('id')->on('lead_phases')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_chat_logs');
    }
};
