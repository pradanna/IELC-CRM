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

            $invoice = Invoice::create([
                'invoice_number' => 'INV-' . strtoupper(Str::random(8)),
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

            // Dispatch Event (Decoupled concerns)
            InvoiceGenerated::dispatch($invoice, $data);

            return $invoice;
        });
    }
}


