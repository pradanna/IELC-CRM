<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Stores the invoice type at creation time, immutable after creation
            $table->string('type', 50)
                  ->default('new_join')
                  ->after('status');
        });

        // Backfill existing invoices:
        // - has student_id => rejoin
        // - has lead_id only => new_join
        // - no study_class_id => placement_test (handled by items, keep as new_join for now)
        DB::statement("UPDATE invoices SET type = 'rejoin' WHERE student_id IS NOT NULL");
        DB::statement("UPDATE invoices SET type = 'new_join' WHERE lead_id IS NOT NULL AND student_id IS NULL");
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
