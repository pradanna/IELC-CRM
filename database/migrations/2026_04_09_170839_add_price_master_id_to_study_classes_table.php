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
        Schema::table('study_classes', function (Blueprint $table) {
            $table->foreignUuid('price_master_id')->nullable()->after('instructor_id')->constrained('price_masters')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('study_classes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('price_master_id');
        });
    }
};
