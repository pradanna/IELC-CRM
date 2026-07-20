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
        Schema::table('loyalty_settings', function (Blueprint $table) {
            $table->boolean('use_join_date_limit')->default(false)->after('min_rejoin_count');
            $table->date('join_date_limit')->nullable()->after('use_join_date_limit');
            $table->string('join_date_operator')->default('before')->after('join_date_limit'); // 'before' or 'after'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loyalty_settings', function (Blueprint $table) {
            $table->dropColumn(['use_join_date_limit', 'join_date_limit', 'join_date_operator']);
        });
    }
};
