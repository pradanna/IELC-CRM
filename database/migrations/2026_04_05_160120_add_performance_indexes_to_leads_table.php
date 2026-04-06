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
        Schema::table('leads', function (Blueprint $table) {
             // Composite index for dashboard task query
             $table->index(['lead_phase_id', 'last_activity_at'], 'idx_leads_phase_activity');
             $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex('idx_leads_phase_activity');
            $table->dropIndex(['created_at']);
        });
    }
};
