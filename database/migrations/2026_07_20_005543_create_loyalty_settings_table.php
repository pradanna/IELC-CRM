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
        Schema::create('loyalty_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tier_name');
            $table->string('voucher_name');
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->unsignedInteger('cafe_points')->default(0);
            $table->unsignedInteger('min_rejoin_count')->default(0);
            $table->boolean('use_join_date_limit')->default(false);
            $table->date('join_date_limit')->nullable();
            $table->enum('join_date_operator', ['before', 'after'])->default('before');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loyalty_settings');
    }
};
