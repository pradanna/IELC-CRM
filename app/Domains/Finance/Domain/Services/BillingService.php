<?php

namespace App\Domains\Finance\Domain\Services;

use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\Finance\Domain\Models\PriceMaster;

class BillingService
{
    /**
     * Calculate the billing amount for a class plotting.
     */
    public function calculatePlottingAmount(StudyClass $studyClass, PriceMaster $priceMaster, array $data): array
    {
        $billingMode = $data['billing_mode'] ?? 'prorata';
        $remaining = 0;
        $baseSubtotal = 0;

        if ($billingMode === 'full') {
            $remaining = $studyClass->total_meetings;
            $baseSubtotal = $priceMaster->price_per_session;
        } else {
            // Calculate remaining sessions from join_date
            $joinDate = isset($data['join_date']) ? new \DateTime($data['join_date']) : new \DateTime();
            $endDate = new \DateTime($studyClass->end_session_date->format('Y-m-d'));
            $scheduleDays = $studyClass->schedule_days;

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

        return [
            'sessions' => $remaining,
            'amount' => $baseSubtotal,
        ];
    }
}

