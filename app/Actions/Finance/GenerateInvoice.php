<?php

namespace App\Actions\Finance;

use App\Models\Invoice;
use App\Models\Lead;
use App\Models\PriceMaster;
use App\Models\StudyClass;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class GenerateInvoice
{
    /**
     * Generate an invoice for a lead/student based on class plotting.
     */
    public function handle(array $data): Invoice
    {
        return DB::transaction(function () use ($data) {
            $studyClass = StudyClass::findOrFail($data['study_class_id']);
            $priceMaster = PriceMaster::findOrFail($data['price_master_id']);
            
            // Calculate remaining sessions
            $passed = $studyClass->session_progress;
            $remaining = max(0, $studyClass->total_meetings - $passed);
            
            // (Package Price / Total Meetings) * Remaining Sessions
            $pricePerMeeting = $priceMaster->price_per_session / ($studyClass->total_meetings ?: 1);
            $baseSubtotal = round($remaining * $pricePerMeeting);

            $invoice = Invoice::create([
                'invoice_number' => 'INV-' . strtoupper(Str::random(8)),
                'lead_id' => $data['lead_id'] ?? null,
                'student_id' => $data['student_id'] ?? null,
                'study_class_id' => $studyClass->id,
                'total_amount' => 0, // Updated later
                'session_count' => $remaining,
                'status' => 'pending',
                'due_date' => now()->addDays(7),
                'notes' => $data['notes'] ?? "Invoice for {$remaining} remaining sessions in {$studyClass->name}",
            ]);

            // Create base class plot item
            $invoice->items()->create([
                'price_master_id' => $priceMaster->id,
                'name' => "Plotting: {$studyClass->name} ({$remaining} sessions)",
                'quantity' => 1,
                'unit_price' => $baseSubtotal,
                'subtotal' => $baseSubtotal,
            ]);

            $totalAmount = $baseSubtotal;

            // Handle additional items
            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    $itemSubtotal = $item['unit_price'] * $item['quantity'];
                    $invoice->items()->create([
                        'name' => $item['name'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'subtotal' => $itemSubtotal,
                    ]);
                    $totalAmount += $itemSubtotal;
                }
            }

            $invoice->update(['total_amount' => $totalAmount]);

            // Clear dashboard cache
            \Illuminate\Support\Facades\Cache::increment('crm_dashboard_version');

            // Update Lead phase if applicable
            if ($invoice->lead) {
                $invoicePhase = \App\Models\LeadPhase::where('code', 'invoice')->first();
                $invoice->lead->update(['lead_phase_id' => $invoicePhase?->id]);
            }

            return $invoice;
        });
    }
}
