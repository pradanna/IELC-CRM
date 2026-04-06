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
        $tables = ['superadmins', 'marketing', 'frontdesks', 'finance'];

        foreach ($tables as $name) {
            Schema::create($name, function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->index()->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->string('phone')->nullable();
                $table->text('address')->nullable();
                $table->string('photo_path')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('finance');
        Schema::dropIfExists('frontdesks');
        Schema::dropIfExists('marketing');
        Schema::dropIfExists('superadmins');
    }
};
