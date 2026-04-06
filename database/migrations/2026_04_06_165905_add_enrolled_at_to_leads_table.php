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
            $table->timestamp('enrolled_at')->nullable()->after('last_activity_at')->index();
        });

        // Set enrolled_at for existing enrolled leads
        $enrolledPhaseId = \App\Models\LeadPhase::where('code', 'enrollment')->first()?->id;
        if ($enrolledPhaseId) {
            \App\Models\Lead::where('lead_phase_id', $enrolledPhaseId)
                ->whereNull('enrolled_at')
                ->update(['enrolled_at' => \DB::raw('updated_at')]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('enrolled_at');
        });
    }
};
