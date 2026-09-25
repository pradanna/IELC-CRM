<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Drop pt_kids_question_groups table and foreign key from pt_kids_questions.
     */
    public function up(): void
    {
        if (Schema::hasColumn('pt_kids_questions', 'pt_kids_question_group_id')) {
            Schema::table('pt_kids_questions', function (Blueprint $table) {
                $table->dropForeign(['pt_kids_question_group_id']);
                $table->dropColumn('pt_kids_question_group_id');
            });
        }

        Schema::dropIfExists('pt_kids_question_groups');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('pt_kids_question_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pt_exam_id')->constrained('pt_exams')->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->text('instruction')->nullable();
            $table->string('theme_color')->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        Schema::table('pt_kids_questions', function (Blueprint $table) {
            $table->foreignUuid('pt_kids_question_group_id')->nullable()->constrained('pt_kids_question_groups')->nullOnDelete();
        });
    }
};
