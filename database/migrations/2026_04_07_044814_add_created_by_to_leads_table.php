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
            $table->foreignUuid('created_by')->nullable()->after('owner_id')->constrained('users')->onDelete('set null');
        });

        // Retroactively set created_by to match owner_id for existing leads
        \Illuminate\Support\Facades\DB::table('leads')->update([
            'created_by' => \Illuminate\Support\Facades\DB::raw('owner_id')
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn('created_by');
        });
    }
};
