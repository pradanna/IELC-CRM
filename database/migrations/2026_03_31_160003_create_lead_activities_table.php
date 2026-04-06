<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();

            // type: phase_changed, follow_up, note, task_created, owner_changed
            $table->string('type');

            $table->text('description');
            $table->timestamps();

            $table->index('lead_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_activities');
    }
};
