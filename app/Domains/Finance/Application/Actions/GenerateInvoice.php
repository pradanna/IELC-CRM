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
            $studyClass = $this->studyClassRepository->findOrFail($data['study_class_id']);
            $priceMaster = PriceMaster::findOrFail($data['price_master_id']);
            
            // Delegate calculation to Domain Service
            $calculation = $this->billingService->calculatePlottingAmount($studyClass, $priceMaster, $data);
            $remaining = $calculation['sessions'];
            $baseSubtotal = $calculation['amount'];

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
                        $additionalNotes[] = "Mendapatkan Voucher: " . $matchingSetting->voucher_name . " dan Voucher Cafe senilai Rp " . number_format($matchingSetting->cafe_points, 0, ',', '.') . " setelah tagihan dilunasi.";
                    }
                }
            }

            if (!$leadObj && !empty($data['lead_id'])) {
                $leadObj = \App\Domains\CRM\Domain\Models\Lead::find($data['lead_id']);
            }

            // 2. Sibling Discount matching
            $useSiblingDiscount = filter_var(\App\Domains\Finance\Domain\Models\FinanceSetting::get('use_sibling_discount', '1'), FILTER_VALIDATE_BOOLEAN);
            if ($useSiblingDiscount && $leadObj) {
                $hasSibling = $leadObj->relatedLeads()->wherePivot('type', 'sibling')->exists();
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

            if (!empty($additionalNotes)) {
                $notes = implode("\n", $additionalNotes);
            }

            $startDate = $data['join_date'] ?? ($studyClass->start_session_date ? $studyClass->start_session_date->format('Y-m-d') : null);
            $endDate = $studyClass->end_session_date ? $studyClass->end_session_date->format('Y-m-d') : null;

            $invoice = Invoice::create([
                'invoice_number' => 'INV-' . strtoupper(Str::random(8)),
                'lead_id' => $data['lead_id'] ?? null,
                'student_id' => $data['student_id'] ?? null,
                'study_class_id' => $studyClass->id,
                'total_amount' => 0, // Updated later
                'discount_amount' => $discountAmount,
                'session_count' => $remaining,
                'start_date' => $startDate,
                'status' => 'pending',
                'due_date' => now()->addDays(7),
                'notes' => $notes,
            ]);

            $periodLabel = '';
            if ($startDate && $endDate) {
                $startFmt = \Carbon\Carbon::parse($startDate)->translatedFormat('d M Y');
                $endFmt = \Carbon\Carbon::parse($endDate)->translatedFormat('d M Y');
                $periodLabel = " | Periode Belajar: {$startFmt} - {$endFmt}";
            }

            // Create base class plot item
            $invoice->items()->create([
                'price_master_id' => $priceMaster->id,
                'name' => "Plotting: {$studyClass->name} ({$remaining} Sesi{$periodLabel})",
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

            // Apply discount
            $totalAmount = max(0, $totalAmount - $discountAmount);

            $invoice->update(['total_amount' => $totalAmount]);



            // Dispatch Event (Decoupled concerns)
            InvoiceGenerated::dispatch($invoice, $data);

            return $invoice;
        });
    }
}


