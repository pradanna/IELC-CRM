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
        if (!Schema::hasTable('payment_accounts')) {
            Schema::create('payment_accounts', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name'); // e.g. "Bank BCA", "Kas Tunai", "QRIS Dinamis"
                $table->string('type')->default('bank'); // string type (not enum) for PostgreSQL/MySQL/SQLite compatibility (bank, cash, qris, edc, other)
                $table->string('account_number')->nullable();
                $table->string('account_holder')->nullable();
                $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
                $table->boolean('is_active')->default(true);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index('type');
                $table->index('is_active');
                $table->index('branch_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_accounts');
    }
};
