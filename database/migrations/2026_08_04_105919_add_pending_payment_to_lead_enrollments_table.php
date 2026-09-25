<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE lead_enrollments MODIFY COLUMN status ENUM('active', 'completed', 'stopped', 'pending_invoice', 'pending_payment') NOT NULL DEFAULT 'active'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE lead_enrollments MODIFY COLUMN status ENUM('active', 'completed', 'stopped') NOT NULL DEFAULT 'active'");
        }
    }
};
