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
        if (!Schema::hasColumn('study_classes', 'manual_session_progress')) {
            Schema::table('study_classes', function (Blueprint $table) {
                $table->unsignedInteger('manual_session_progress')->nullable()->after('total_meetings');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('study_classes', function (Blueprint $table) {
            $table->dropColumn('manual_session_progress');
        });
    }
};
