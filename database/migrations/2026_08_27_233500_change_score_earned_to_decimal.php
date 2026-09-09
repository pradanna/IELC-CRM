<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Change score_earned and final_score to support decimal precision for proportional grading.
     */
    public function up(): void
    {
        Schema::table('pt_kids_answers', function (Blueprint $table) {
            $table->decimal('score_earned', 8, 2)->default(0)->change();
        });

        Schema::table('pt_sessions', function (Blueprint $table) {
            $table->decimal('final_score', 8, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pt_kids_answers', function (Blueprint $table) {
            $table->integer('score_earned')->default(0)->change();
        });

        Schema::table('pt_sessions', function (Blueprint $table) {
            $table->integer('final_score')->nullable()->change();
        });
    }
};
