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
            $table->text('instruction')->change();
        });
        
        Schema::table('pt_questions', function (Blueprint $table) {
            $table->text('instruction')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pt_question_groups', function (Blueprint $table) {
            $table->string('instruction')->change();
        });
        
        Schema::table('pt_questions', function (Blueprint $table) {
            $table->string('instruction')->change();
        });
    }
};
