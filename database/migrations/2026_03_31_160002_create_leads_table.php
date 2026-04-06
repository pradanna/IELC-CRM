<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('lead_number')->unique();
            $table->string('name')->nullable();
            $table->string('phone');
            $table->string('email')->nullable();

            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignUuid('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('lead_source_id')->nullable()->constrained('lead_sources')->nullOnDelete();

            $table->foreignUuid('lead_type_id')->nullable()->constrained('lead_types')->nullOnDelete();
            $table->foreignUuid('lead_phase_id')->nullable()->constrained('lead_phases')->nullOnDelete();

            $table->boolean('is_online')->default(false);
            $table->string('province')->nullable();
            $table->string('city')->nullable();
            $table->unsignedInteger('follow_up_count')->default(0);
            $table->timestamp('last_activity_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('branch_id');
            $table->index('owner_id');
            $table->index('last_activity_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
