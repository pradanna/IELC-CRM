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
        Schema::table('pt_question_groups', function (Blueprint $table) {
            $table->integer('position')->default(0)->after('reading_text');
        });

        Schema::table('pt_questions', function (Blueprint $table) {
            $table->integer('number')->nullable()->after('pt_question_group_id');
            $table->integer('position')->default(0)->after('points');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pt_question_groups', function (Blueprint $table) {
            $table->dropColumn('position');
        });

        Schema::table('pt_questions', function (Blueprint $table) {
            $table->dropColumn(['number', 'position']);
        });
    }
};
