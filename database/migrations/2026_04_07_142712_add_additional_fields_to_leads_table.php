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
            $table->string('nickname')->nullable()->after('name');
            $table->enum('gender', ['L', 'P'])->nullable()->after('nickname');
            $table->string('school')->nullable()->after('birth_date');
            $table->string('grade')->nullable()->after('school');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['nickname', 'gender', 'school', 'grade']);
        });
    }
};
