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
            $table->timestamp('reached_prospective_at')->nullable()->after('enrolled_at');
            $table->timestamp('lost_at')->nullable()->after('reached_prospective_at');
        });

        // Backfill data for existing leads
        $prospectiveCodes = ['prospect', 'consultation', 'placement-test', 'pre-enrollment', 'invoice', 'enrollment'];
        $lostCodes = ['cold-leads', 'dropout-leads'];

        // 1. Fill reached_prospective_at for leads already in prospective or enrolled phases
        DB::table('leads')
            ->whereNull('reached_prospective_at')
            ->whereIn('lead_phase_id', function ($query) use ($prospectiveCodes) {
                $query->select('id')->from('lead_phases')->whereIn('code', $prospectiveCodes);
            })
            ->update(['reached_prospective_at' => DB::raw('updated_at')]);

        // 2. Fill lost_at for leads currently in lost phases
        DB::table('leads')
            ->whereNull('lost_at')
            ->whereIn('lead_phase_id', function ($query) use ($lostCodes) {
                $query->select('id')->from('lead_phases')->whereIn('code', $lostCodes);
            })
            ->update(['lost_at' => DB::raw('updated_at')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['reached_prospective_at', 'lost_at']);
        });
    }
};
