<?php

namespace App\Domains\Finance\Application\Actions;

use App\Domains\Finance\Domain\Events\InvoicePaid;
use App\Domains\Finance\Domain\Models\Invoice;
use Illuminate\Support\Facades\DB;

class ProcessInvoicePayment
{
    /**
     * Process an invoice payment, promoting the lead to student if necessary.
     */
    public function handle(Invoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            // Update student status if applicable
            if ($invoice->student_id) {
                $student = $invoice->student;
                $student->increment('rejoin_count');
                $student->update(['status' => 'active']);

                // Process loyalty tiers
                $newRejoinCount = $student->rejoin_count;
                $matchingSettings = \App\Domains\Finance\Domain\Models\LoyaltySetting::orderBy('min_rejoin_count', 'desc')
                    ->get()
                    ->filter(function ($setting) use ($student) {
                        return $setting->matchesStudent($student);
                    });

                if ($matchingSettings->isNotEmpty()) {
                    $highestTier = $matchingSettings->first();
                    $student->update(['loyalty_tier' => $highestTier->tier_name]);

                    foreach ($matchingSettings as $setting) {
                        $alreadyAwarded = $student->loyaltyRewards()
                            ->where('tier_name', $setting->tier_name)
                            ->exists();

                        if (!$alreadyAwarded) {
                            $student->loyaltyRewards()->create([
                                'tier_name' => $setting->tier_name,
                                'voucher_name' => $setting->voucher_name,
                                'discount_amount' => $setting->discount_amount,
                                'cafe_points' => $setting->cafe_points,
                                'is_used' => false,
                            ]);
                        }
                    }
                }
            }

            // Dispatch Event (Decoupled concerns)
            InvoicePaid::dispatch($invoice);
        });
    }
}


