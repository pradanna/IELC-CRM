<?php

namespace App\Actions\Finance;

use App\Models\Invoice;
use App\Models\Lead;
use App\Models\PriceMaster;
use App\Models\StudyClass;
use Illuminate\Support\Str;

class GenerateInvoice
{
    /**
     * Generate an invoice for a lead/student based on class plotting.
     */
    public function handle(array $data): Invoice
    {
        $studyClass = StudyClass::findOrFail($data['study_class_id']);
        $priceMaster = PriceMaster::findOrFail($data['price_master_id']);
        
        // Calculate remaining sessions
        // total_meetings - current_session_progress
        $passed = $studyClass->session_progress;
        $remaining = max(0, $studyClass->total_meetings - $passed);
        
        $totalAmount = $remaining * $priceMaster->price_per_session;

        return Invoice::create([
            'invoice_number' => 'INV-' . strtoupper(Str::random(8)),
            'lead_id' => $data['lead_id'] ?? null,
            'student_id' => $data['student_id'] ?? null,
            'study_class_id' => $studyClass->id,
            'total_amount' => $totalAmount,
            'session_count' => $remaining,
            'status' => 'pending',
            'notes' => $data['notes'] ?? "Invoice for {$remaining} remaining sessions in {$studyClass->name}",
        ]);
    }
}
