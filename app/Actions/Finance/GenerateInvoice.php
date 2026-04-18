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
            
            // Calculate sessions and subtotal
            $billingMode = $data['billing_mode'] ?? 'prorata';
            $remaining = 0;
            $baseSubtotal = 0;

            if ($billingMode === 'full') {
                $remaining = $studyClass->total_meetings;
                $baseSubtotal = $priceMaster->price_per_session;
            } else {
                // Calculate remaining sessions from join_date (Synchronized with frontend)
                $joinDate = isset($data['join_date']) ? new \DateTime($data['join_date']) : new \DateTime();
                $endDate = new \DateTime($studyClass->end_session_date->format('Y-m-d'));
                $scheduleDays = $studyClass->schedule_days; // Array of day names

                if ($joinDate > $endDate) {
                    $remaining = 0;
                } else {
                    $remaining = 0;
                    $current = clone $joinDate;
                    while ($current <= $endDate) {
                        $dayName = $current->format('l');
                        if (in_array($dayName, $scheduleDays)) {
                            $remaining++;
                        }
                        $current->modify('+1 day');
                    }
                }

                $pricePerMeeting = $priceMaster->price_per_session / ($studyClass->total_meetings ?: 1);
                $baseSubtotal = round($remaining * $pricePerMeeting);
            }

            $invoice = \App\Models\Invoice::create([
                'invoice_number' => 'INV-' . strtoupper(\Illuminate\Support\Str::random(8)),
                'lead_id' => $data['lead_id'] ?? null,
                'student_id' => $data['student_id'] ?? null,
                'study_class_id' => $studyClass->id,
                'total_amount' => 0, // Updated later
                'session_count' => $remaining,
                'status' => 'pending',
                'due_date' => now()->addDays(7),
                'notes' => $data['notes'] ?? "Invoice for {$remaining} sessions in {$studyClass->name}",
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

            // Send Notifications
            $lead = \App\Models\Lead::find($data['lead_id'] ?? null);
            $student = \App\Models\Student::find($data['student_id'] ?? null);
            $entityName = $lead ? $lead->name : ($student ? $student->lead->name : 'Student');
            
            $notification = new \App\Notifications\SystemNotification(
                "Invoice Terbit: {$invoice->invoice_number}",
                "Invoice baru senilai Rp " . number_format($totalAmount, 0, ',', '.') . " telah diterbitkan untuk {$entityName}.",
                'invoice',
                $lead ? "/admin/crm/leads?id={$lead->id}" : "/admin/finance"
            );

            // Notify Lead Owner
            if ($lead && $lead->owner) {
                $lead->owner->notify($notification);
            }

            // Notify Superadmins
            $superadmins = \App\Models\User::role('superadmin')->get();
            foreach ($superadmins as $admin) {
                if ($lead && $lead->owner_id === $admin->id) continue;
                $admin->notify($notification);
            }

            // Clear dashboard cache
            \Illuminate\Support\Facades\Cache::increment('crm_dashboard_version');

            // Update Lead phase if applicable
            if ($lead) {
                $invoicePhase = \App\Models\LeadPhase::where('code', 'invoice')->first();
                $lead->update(['lead_phase_id' => $invoicePhase?->id]);
            }

            return $invoice;
        });
    }
}
