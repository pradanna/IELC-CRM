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
        Schema::table('lead_chat_logs', function (Blueprint $table) {
            // Nullable user_id to allow incoming webhook messages from customers
            $table->uuid('user_id')->nullable()->change();
            // Channel column: 'official' vs 'baileys' (default 'baileys')
            $table->string('channel')->default('baileys')->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lead_chat_logs', function (Blueprint $table) {
            $table->dropColumn('channel');
        });
    }
};
