<?php

namespace App\Domains\Academic\Application\Actions;

use App\Domains\Academic\Domain\Models\ClassAttendance;
use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use Carbon\Carbon;

class CalculateClassTransferDifference
{
    /**
     * Calculate remaining sessions and price difference between two classes for a student.
     *
     * @param Student $student
     * @param string|StudyClass $fromClass
     * @param string|StudyClass $toClass
     * @param string|null $effectiveDate
     * @return array
     */
    public function handle(
        Student $student,
        string|StudyClass $fromClass,
        string|StudyClass $toClass,
        ?string $effectiveDate = null
    ): array {
        $effectiveDate = $effectiveDate ? Carbon::parse($effectiveDate)->startOfDay() : now()->startOfDay();

        $from = is_string($fromClass) ? StudyClass::with('priceMaster')->find($fromClass) : $fromClass;
        $to = is_string($toClass) ? StudyClass::with('priceMaster')->find($toClass) : $toClass;

        if (!$from || !$to) {
            return [
                'from_remaining' => 0,
                'to_remaining' => 0,
                'difference_sessions' => 0,
                'requires_invoice' => false,
                'price_per_session' => 0,
                'invoice_amount' => 0,
                'from_class_name' => $from?->name ?? '',
                'to_class_name' => $to?->name ?? '',
                'price_master_name' => null,
            ];
        }

        $fromRemaining = $this->calculateRemainingSessions($from, $effectiveDate, $student);
        $toRemaining = $this->calculateRemainingSessions($to, $effectiveDate, null);

        $differenceSessions = max(0, $toRemaining - $fromRemaining);
        $requiresInvoice = $differenceSessions > 0;

        $priceMaster = $to->priceMaster ?: $from->priceMaster;
        $pricePerSession = 0;
        $invoiceAmount = 0;

        if ($requiresInvoice && $priceMaster) {
            $totalPackageSessions = (int) ($to->total_meetings ?: $priceMaster->total_sessions ?: 1);
            if ($totalPackageSessions <= 0) {
                $totalPackageSessions = 1;
            }
            $pricePerSession = (int) round($priceMaster->price_per_session / $totalPackageSessions);
            $invoiceAmount = (int) ($differenceSessions * $pricePerSession);
        }

        return [
            'from_remaining' => $fromRemaining,
            'to_remaining' => $toRemaining,
            'difference_sessions' => $differenceSessions,
            'requires_invoice' => $requiresInvoice,
            'price_per_session' => $pricePerSession,
            'invoice_amount' => $invoiceAmount,
            'from_class_name' => $from->name,
            'to_class_name' => $to->name,
            'price_master_name' => $priceMaster?->name,
        ];
    }

    /**
     * Calculate remaining sessions for a class as of the given date.
     *
     * @param StudyClass $studyClass
     * @param Carbon $effectiveDate
     * @param Student|null $student
     * @return int
     */
    public function calculateRemainingSessions(StudyClass $studyClass, Carbon $effectiveDate, ?Student $student = null): int
    {
        $totalMeetings = (int) ($studyClass->total_meetings ?: 0);
        $attendedCount = 0;

        if ($student) {
            $attendedCount = ClassAttendance::where('study_class_id', $studyClass->id)
                ->where('student_id', $student->id)
                ->count();
        }

        $isPrivate = (bool) $studyClass->is_private 
            || strcasecmp($studyClass->category ?? '', 'private') === 0 
            || str_contains(strtolower($studyClass->name ?? ''), 'private');

        // 1. Private classes or classes with no schedule days / no end session date
        if ($isPrivate || empty($studyClass->end_session_date) || empty($studyClass->schedule_days)) {
            $currentProgress = max((int) ($studyClass->manual_session_progress ?? 0), (int) ($studyClass->session_progress ?? 0), $attendedCount);
            return max(0, $totalMeetings - $currentProgress);
        }

        // 2. Group classes with schedule_days and end_session_date
        $endDate = $studyClass->end_session_date->copy()->startOfDay();

        if ($effectiveDate->greaterThan($endDate)) {
            return 0;
        }

        $startDate = $studyClass->start_session_date ? $studyClass->start_session_date->copy()->startOfDay() : null;
        $scheduleDays = array_map('strtolower', (array) $studyClass->schedule_days);

        $current = $effectiveDate->copy();
        if ($startDate && $current->lessThan($startDate)) {
            $current = $startDate->copy();
        }

        $scheduledRemaining = 0;
        while ($current->lessThanOrEqualTo($endDate)) {
            if (in_array(strtolower($current->format('l')), $scheduleDays, true)) {
                $scheduledRemaining++;
            }
            $current->addDay();
        }

        if ($totalMeetings > 0) {
            $scheduledRemaining = min($totalMeetings, $scheduledRemaining);
        }

        if ($attendedCount > 0 && $totalMeetings > 0) {
            $scheduledRemaining = min($scheduledRemaining, max(0, $totalMeetings - $attendedCount));
        }

        // Fallback if calculated 0 before class starts
        if ($scheduledRemaining === 0 && $startDate && $effectiveDate->lessThanOrEqualTo($startDate)) {
            $scheduledRemaining = max(0, $totalMeetings - (int) ($studyClass->session_progress ?? 0));
        }

        return $scheduledRemaining;
    }
}
