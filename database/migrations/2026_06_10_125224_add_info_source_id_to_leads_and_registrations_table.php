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
            $table->foreignUuid('info_source_id')->nullable()->after('lead_source_id')->constrained('info_sources')->nullOnDelete();
        });

        Schema::table('lead_registrations', function (Blueprint $table) {
            $table->foreignUuid('info_source_id')->nullable()->after('branch_id')->constrained('info_sources')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lead_registrations', function (Blueprint $table) {
            $table->dropForeign(['info_source_id']);
            $table->dropColumn('info_source_id');
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['info_source_id']);
            $table->dropColumn('info_source_id');
        });
    }
};
