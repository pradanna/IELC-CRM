<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('lead_enrollments')) {
            Schema::create('lead_enrollments', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('lead_id')->constrained('leads')->cascadeOnDelete();
                $table->foreignUuid('student_id')->nullable()->constrained('students')->nullOnDelete();
                $table->foreignUuid('study_class_id')->constrained('study_classes')->cascadeOnDelete();
                $table->foreignUuid('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
                $table->date('joined_at');
                $table->date('end_date')->nullable();
                $table->date('stopped_at')->nullable();
                $table->enum('status', ['active', 'completed', 'stopped'])->default('active');
                $table->unsignedInteger('cycle_number')->default(1);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index('joined_at');
                $table->index('end_date');
                $table->index('status');
                $table->index(['lead_id', 'joined_at']);
            });
        }

        // Backfill: Create lead_enrollment records from existing paid invoices
        $paidInvoices = DB::table('invoices')
            ->whereNotNull('lead_id')
            ->whereNotNull('study_class_id')
            ->where('status', 'paid')
            ->whereNotIn('type', ['placement_test', 'paket_lanjut'])
            ->get();

        foreach ($paidInvoices as $invoice) {
            $joinedAt = $invoice->start_date
                ?? $invoice->paid_at
                ?? $invoice->created_at;

            $joinedAtDate = $joinedAt ? date('Y-m-d', strtotime($joinedAt)) : date('Y-m-d');

            $studyClass = DB::table('study_classes')->where('id', $invoice->study_class_id)->first();
            $endDate = $studyClass?->end_session_date;

            DB::table('lead_enrollments')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'lead_id' => $invoice->lead_id,
                'student_id' => $invoice->student_id,
                'study_class_id' => $invoice->study_class_id,
                'invoice_id' => $invoice->id,
                'joined_at' => $joinedAtDate,
                'end_date' => $endDate,
                'status' => 'active',
                'cycle_number' => $studyClass?->current_session_number ?? 1,
                'created_at' => $invoice->paid_at ?? $invoice->created_at,
                'updated_at' => $invoice->paid_at ?? $invoice->created_at,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_enrollments');
    }
};
