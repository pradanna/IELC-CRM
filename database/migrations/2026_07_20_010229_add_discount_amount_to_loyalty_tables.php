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
            $table->unsignedInteger('discount_amount')->default(0)->after('voucher_name');
        });

        Schema::table('student_loyalty_rewards', function (Blueprint $table) {
            $table->unsignedInteger('discount_amount')->default(0)->after('voucher_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loyalty_settings', function (Blueprint $table) {
            $table->dropColumn('discount_amount');
        });

        Schema::table('student_loyalty_rewards', function (Blueprint $table) {
            $table->dropColumn('discount_amount');
        });
    }
};
