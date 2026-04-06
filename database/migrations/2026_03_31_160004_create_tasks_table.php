<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignUuid('assigned_to')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();

            // priority: normal, urgent
            $table->string('priority')->default('normal');

            $table->boolean('is_completed')->default(false);
            $table->date('due_date');
            $table->timestamps();

            $table->index('lead_id');
            $table->index('assigned_to');
            $table->index('is_completed');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
