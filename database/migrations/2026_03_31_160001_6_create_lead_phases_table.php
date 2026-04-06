<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_phases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('name'); // Lead, Prospect, Consultation, Placement Test, Pre-Enrollment, Invoice, Cold Leads, Dropout Leads
            $table->string('status')->index(); // new, prospective, closing, lost
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_phases');
    }
};
