<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('price_masters', function (Blueprint $table) {
            $table->unsignedInteger('total_sessions')->nullable()->default(null)->after('price_per_session');
        });

        // Automatically infer and populate total_sessions for existing price masters
        $prices = DB::table('price_masters')->get();
        foreach ($prices as $p) {
            $sessions = null;
            $name = $p->name ?? '';

            if (preg_match('/(\d+)\s*(sessions|sesi)/i', $name, $matches)) {
                $sessions = (int) $matches[1];
            } elseif (preg_match('/12\s*weeks|3\s*bulan/i', $name)) {
                $sessions = 24;
            } elseif (stripos($name, 'group') !== false) {
                $sessions = 24;
            } elseif (stripos($name, 'private') !== false) {
                $sessions = 36;
            }

            if ($sessions) {
                DB::table('price_masters')->where('id', $p->id)->update(['total_sessions' => $sessions]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('price_masters', function (Blueprint $table) {
            $table->dropColumn('total_sessions');
        });
    }
};
