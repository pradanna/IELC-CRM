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
            $table->string('nickname')->nullable();
            $table->enum('gender', ['L', 'P'])->nullable();
            $table->string('phone');
            $table->string('email')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('school')->nullable();
            $table->string('grade')->nullable();

            $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignUuid('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignUuid('lead_source_id')->nullable()->constrained('lead_sources')->nullOnDelete();

            $table->foreignUuid('lead_type_id')->nullable()->constrained('lead_types')->nullOnDelete();
            $table->foreignUuid('lead_phase_id')->nullable()->constrained('lead_phases')->nullOnDelete();

            $table->boolean('is_online')->default(false);
            $table->string('province')->nullable();
            $table->string('city')->nullable();
            $table->text('address')->nullable();
            $table->string('postal_code', 10)->nullable();
            
            $table->unsignedInteger('follow_up_count')->default(0);
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamp('enrolled_at')->nullable();
            
            $table->string('self_registration_token')->nullable()->unique();
            $table->json('pending_updates')->nullable();
            $table->json('plotting')->nullable();
            $table->text('notes')->nullable();
            
            $table->softDeletes();
            $table->timestamps();

            $table->index('branch_id');
            $table->index('owner_id');
            $table->index('last_activity_at');
            $table->index('enrolled_at');
            $table->index('created_at');
            $table->index(['lead_phase_id', 'last_activity_at'], 'idx_leads_phase_activity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
