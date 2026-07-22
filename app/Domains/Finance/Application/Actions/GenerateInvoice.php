<?php

namespace App\Domains\Finance\Application\Actions;

use App\Domains\Finance\Domain\Events\InvoiceGenerated;
use App\Domains\Finance\Domain\Models\Invoice;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Domains\Academic\Domain\Repositories\StudyClassRepositoryInterface;
use App\Domains\Finance\Domain\Services\BillingService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class GenerateInvoice
{
    public function __construct(
        protected BillingService $billingService,
        protected StudyClassRepositoryInterface $studyClassRepository
    ) {}

    /**
     * Generate an invoice for a lead/student based on class plotting.
     */
    public function handle(array $data): Invoice
    {
        return DB::transaction(function () use ($data) {
            // Cancel previous pending invoices for this lead or student to prevent multiple active pending invoices
            if (!empty($data['student_id'])) {
                Invoice::where('student_id', $data['student_id'])
                    ->where('status', 'pending')
                    ->update(['status' => 'cancelled']);
            } elseif (!empty($data['lead_id'])) {
                Invoice::where('lead_id', $data['lead_id'])
                    ->where('status', 'pending')
                    ->update(['status' => 'cancelled']);
            }

            $studyClass = !empty($data['study_class_id']) ? \App\Domains\Academic\Domain\Models\StudyClass::find($data['study_class_id']) : null;
            $priceMaster = !empty($data['price_master_id']) ? PriceMaster::find($data['price_master_id']) : null;
            
            $remaining = 0;
            $baseSubtotal = 0;

            if ($studyClass && $priceMaster) {
                // Delegate calculation to Domain Service
                $calculation = $this->billingService->calculatePlottingAmount($studyClass, $priceMaster, $data);
                $remaining = $calculation['sessions'];
                $baseSubtotal = $calculation['amount'];
            }

            $discountAmount = 0;
            $notes = $data['notes'] ?? null;

            // Automatically calculate discounts based on loyalty settings and sibling relationship
            $additionalNotes = [];
            $leadObj = null;

            if (!empty($data['student_id'])) {
                $student = \App\Domains\Academic\Domain\Models\Student::find($data['student_id']);
                if ($student) {
                    $leadObj = $student->lead;
                    // 1. Loyalty Setting matching
                    $matchingSetting = \App\Domains\Finance\Domain\Models\LoyaltySetting::orderBy('min_rejoin_count', 'desc')
                        ->get()
                        ->first(function ($setting) use ($student) {
                            return $setting->matchesStudent($student);
                        });
                    
                    if ($matchingSetting) {
                        $discountAmount += $matchingSetting->discount_amount;
                        $additionalNotes[] = "Apabila dibayarkan sebelum tanggal jatuh tempo, Akan mendapatkan voucher (20)";
                    }
                }
            }

            if (!$leadObj && !empty($data['lead_id'])) {
                $leadObj = \App\Domains\CRM\Domain\Models\Lead::find($data['lead_id']);
            }

            // 2. Sibling Discount matching
            $useSiblingDiscount = filter_var(\App\Domains\Finance\Domain\Models\FinanceSetting::get('use_sibling_discount', '1'), FILTER_VALIDATE_BOOLEAN);
            if ($useSiblingDiscount && $leadObj && $baseSubtotal > 0) {
                $hasSibling = $leadObj->relatedLeads()->wherePivot('type', 'sibling')->exists()
                           || \App\Domains\CRM\Domain\Models\LeadRelationship::where(function($q) use ($leadObj) {
                               $q->where('lead_id', $leadObj->id)->orWhere('related_lead_id', $leadObj->id);
                           })->where('type', 'sibling')->exists();
                if ($hasSibling) {
                    $siblingPercent = (int) \App\Domains\Finance\Domain\Models\FinanceSetting::get('sibling_discount_percent', '10');
                    if ($siblingPercent === 0) {
                        $siblingPercent = 10;
                    }
                    $siblingAmt = (int) round(($siblingPercent / 100) * $baseSubtotal);
                    $discountAmount += $siblingAmt;
                    $additionalNotes[] = "Diskon Sibling ({$siblingPercent}%): Rp " . number_format($siblingAmt, 0, ',', '.');
                }
            }

            // 3. Manual discounts from admin
            $manualDiscounts = $data['manual_discounts'] ?? [];
            foreach ($manualDiscounts as $md) {
                $amt = (int) ($md['amount'] ?? 0);
                if ($amt > 0) {
                    $discountAmount += $amt;
                    $label = trim($md['name'] ?? 'Diskon Tambahan');
                    $additionalNotes[] = "{$label}: Rp " . number_format($amt, 0, ',', '.');
                }
            }

            $userNotes = !empty($data['notes']) ? trim($data['notes']) : null;
            $discountBreakdown = !empty($additionalNotes) ? implode("\n", $additionalNotes) : null;

            $startDate = $data['join_date'] ?? ($studyClass?->start_session_date ? $studyClass->start_session_date->format('Y-m-d') : null);
            $endDate = $studyClass?->end_session_date ? $studyClass->end_session_date->format('Y-m-d') : null;

            // Determine invoice type at creation time (immutable)
            $invoiceType = 'new_join';
            if (!empty($data['student_id'])) {
                $invoiceType = 'rejoin';
            } elseif (empty($data['study_class_id'])) {
                $invoiceType = 'placement_test';
            }

            $invoice = Invoice::create([
                'invoice_number' => 'INV-' . strtoupper(Str::random(8)),
                'lead_id'        => $data['lead_id'] ?? null,
                'student_id'     => $data['student_id'] ?? null,
                'study_class_id' => $studyClass?->id,
                'total_amount'   => 0, // Updated later
                'discount_amount' => $discountAmount,
                'session_count'  => $remaining,
                'start_date'     => $startDate,
                'status'         => 'pending',
                'due_date'       => now()->addDays(7),
                'notes'          => $userNotes,
                'discount_breakdown' => $discountBreakdown,
                'type'           => $invoiceType,
            ]);

            $totalAmount = 0;

            if ($studyClass && $priceMaster) {
                $periodLabel = '';
                if ($startDate && $endDate) {
                    $startFmt = \Carbon\Carbon::parse($startDate)->translatedFormat('d M Y');
                    $endFmt = \Carbon\Carbon::parse($endDate)->translatedFormat('d M Y');
                    $periodLabel = "\nPeriode Belajar: {$startFmt} - {$endFmt}";
                }

                // Create base class plot item
                $invoice->items()->create([
                    'price_master_id' => $priceMaster->id,
                    'name' => "Kelas: {$studyClass->name} ({$remaining} Sesi){$periodLabel}",
                    'quantity' => 1,
                    'unit_price' => $baseSubtotal,
                    'subtotal' => $baseSubtotal,
                ]);

                $totalAmount += $baseSubtotal;
            }

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

            // Apply discount
            $totalAmount = max(0, $totalAmount - $discountAmount);

            $invoice->update(['total_amount' => $totalAmount]);



            // Dispatch Event (Decoupled concerns)
            InvoiceGenerated::dispatch($invoice, $data);

            return $invoice;
        });
    }
}


