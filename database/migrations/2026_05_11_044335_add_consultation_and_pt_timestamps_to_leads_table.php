<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->timestamp('first_consultation_at')->nullable()->after('reached_prospective_at');
            $table->timestamp('first_pt_at')->nullable()->after('first_consultation_at');
        });

        // Backfill first_consultation_at from lead_consultations
        $firstConsultations = DB::table('lead_consultations')
            ->select('lead_id', DB::raw('MIN(created_at) as first_date'))
            ->groupBy('lead_id')
            ->get();

        foreach ($firstConsultations as $fc) {
            DB::table('leads')
                ->where('id', $fc->lead_id)
                ->whereNull('first_consultation_at')
                ->update(['first_consultation_at' => $fc->first_date]);
        }

        // Backfill first_pt_at from pt_sessions
        $firstPTs = DB::table('pt_sessions')
            ->select('lead_id', DB::raw('MIN(created_at) as first_date'))
            ->groupBy('lead_id')
            ->get();

        foreach ($firstPTs as $fp) {
            DB::table('leads')
                ->where('id', $fp->lead_id)
                ->whereNull('first_pt_at')
                ->update(['first_pt_at' => $fp->first_date]);
        }
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['first_consultation_at', 'first_pt_at']);
        });
    }
};
