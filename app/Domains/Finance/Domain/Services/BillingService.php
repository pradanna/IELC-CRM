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

        $isPrivate = (bool)$studyClass->is_private 
            || strcasecmp($studyClass->category ?? '', 'private') === 0 
            || str_contains(strtolower($studyClass->name ?? ''), 'private');

        $currentProgress = (int)($studyClass->manual_session_progress ?? $studyClass->session_progress ?? 0);
        $totalMeetings = (int)($studyClass->total_meetings ?: 1);

        // For Full billing mode:
        if ($billingMode === 'full') {
            $remaining = $studyClass->total_meetings;
            $baseSubtotal = (int)$priceMaster->price_per_session;
        } elseif ($isPrivate || empty($studyClass->end_session_date) || empty($studyClass->schedule_days)) {
            // Prorata for private classes or classes without end date/schedule:
            $remaining = max(0, $totalMeetings - $currentProgress);
            $pricePerMeeting = $priceMaster->price_per_session / $totalMeetings;
            $baseSubtotal = (int)round($remaining * $pricePerMeeting);
        } else {
            // Calculate remaining sessions from join_date
            $joinDate = isset($data['join_date']) ? new \DateTime($data['join_date']) : new \DateTime();
            $joinDate->setTime(0, 0, 0);
            $dayOfWeek = (int)$joinDate->format('N'); // 1 (Mon) to 7 (Sun)
            if ($dayOfWeek > 1) {
                $joinDate->modify('-' . ($dayOfWeek - 1) . ' days');
            }

            $startDate = $studyClass->start_session_date 
                ? new \DateTime($studyClass->start_session_date->format('Y-m-d'))
                : clone $joinDate;
            $startDate->setTime(0, 0, 0);

            $endDate = new \DateTime($studyClass->end_session_date->format('Y-m-d'));
            $endDate->setTime(0, 0, 0);
            $scheduleDays = is_array($studyClass->schedule_days) ? $studyClass->schedule_days : [];

            if ($joinDate > $endDate) {
                $remaining = 0;
            } else {
                $remaining = 0;
                $current = clone $joinDate;
                while ($current <= $endDate) {
                    if ($current >= $startDate) {
                        $dayName = $current->format('l');
                        if (in_array($dayName, $scheduleDays)) {
                            $remaining++;
                        }
                    }
                    $current->modify('+1 day');
                }
            }

            // Fallback if join date is within or before start date but calculation returned 0
            if ($remaining === 0 && $joinDate <= $startDate) {
                $remaining = max(0, $totalMeetings - $currentProgress);
            }

            $pricePerMeeting = $priceMaster->price_per_session / $totalMeetings;
            $baseSubtotal = (int)round($remaining * $pricePerMeeting);
        }

        return [
            'sessions' => $remaining,
            'amount' => $baseSubtotal,
        ];
    }
}

