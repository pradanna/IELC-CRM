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

            $discountAmount = isset($data['discount_amount']) ? (int) $data['discount_amount'] : 0;
            $notes = $data['notes'] ?? null;

            // Automatically calculate discounts based on loyalty settings and sibling relationship
            $additionalNotes = [];
            if (!empty($data['student_id'])) {
                $student = \App\Domains\Academic\Domain\Models\Student::find($data['student_id']);
                if ($student) {
                    // 1. Loyalty Setting matching
                    $matchingSetting = \App\Domains\Finance\Domain\Models\LoyaltySetting::orderBy('min_rejoin_count', 'desc')
                        ->get()
                        ->first(function ($setting) use ($student) {
                            return $setting->matchesStudent($student);
                        });
                    
                    if ($matchingSetting) {
                        $discountAmount += $matchingSetting->discount_amount;
                        $additionalNotes[] = "Mendapatkan Voucher: " . $matchingSetting->voucher_name;
                        $additionalNotes[] = "*Pemesanan ini berhak mendapatkan cashback Voucher Cafe senilai Rp " . number_format($matchingSetting->cafe_points, 0, ',', '.') . " setelah tagihan dilunasi.";
                    }

                    // 2. Sibling Discount matching
                    $useSiblingDiscount = filter_var(\App\Domains\Finance\Domain\Models\FinanceSetting::get('use_sibling_discount', '0'), FILTER_VALIDATE_BOOLEAN);
                    if ($useSiblingDiscount && $student->lead) {
                        $hasSibling = $student->lead->relatedLeads()->wherePivot('type', 'sibling')->exists();
                        if ($hasSibling) {
                            $siblingPercent = (int) \App\Domains\Finance\Domain\Models\FinanceSetting::get('sibling_discount_percent', '0');
                            if ($siblingPercent > 0) {
                                $siblingAmt = (int) round(($siblingPercent / 100) * $baseSubtotal);
                                $discountAmount += $siblingAmt;
                                $additionalNotes[] = "Diskon Sibling ({$siblingPercent}%): Rp " . number_format($siblingAmt, 0, ',', '.');
                            }
                        }
                    }
                }
            }

            if (!empty($additionalNotes)) {
                $notes = implode("\n", $additionalNotes);
            }

            if (empty($notes)) {
                $notes = "Invoice for {$remaining} sessions in {$studyClass->name}";
            }

            $invoice = Invoice::create([
                'invoice_number' => 'INV-' . strtoupper(Str::random(8)),
                'lead_id' => $data['lead_id'] ?? null,
                'student_id' => $data['student_id'] ?? null,
                'study_class_id' => $studyClass->id,
                'total_amount' => 0, // Updated later
                'discount_amount' => $discountAmount,
                'session_count' => $remaining,
                'start_date' => $data['join_date'] ?? null,
                'status' => 'pending',
                'due_date' => now()->addDays(7),
                'notes' => $notes,
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

            // Apply discount
            $totalAmount = max(0, $totalAmount - $discountAmount);

            $invoice->update(['total_amount' => $totalAmount]);



            // Dispatch Event (Decoupled concerns)
            InvoiceGenerated::dispatch($invoice, $data);

            return $invoice;
        });
    }
}


