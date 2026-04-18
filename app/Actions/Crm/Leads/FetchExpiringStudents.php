<?php

namespace App\Actions\Crm\Leads;

use App\Models\Student;
use Carbon\Carbon;

class FetchExpiringStudents
{
    /**
     * Fetch students whose study sessions end within the given days.
     */
    public function execute(int $days = 14, $branchId = null)
    {
        $now = Carbon::now();
        $limit = $now->copy()->addDays($days);

        $query = Student::with(['lead', 'studyClasses' => function($q) use ($now, $limit) {
            $q->whereBetween('end_session_date', [$now->toDateString(), $limit->toDateString()])
              ->latest('end_session_date');
        }])
        ->whereHas('studyClasses', function($q) use ($now, $limit) {
            $q->whereBetween('end_session_date', [$now->toDateString(), $limit->toDateString()]);
        });

        if ($branchId && $branchId !== 'all') {
            $query->whereHas('lead', fn($q) => $q->where('branch_id', $branchId));
        }

        return $query->get()->map(function($student) {
            $upcomingClass = $student->studyClasses->first();
            return [
                'id' => $student->id,
                'lead_id' => $student->lead_id,
                'name' => $student->lead->name ?? 'Student',
                'class_name' => $upcomingClass->name ?? 'Unknown Class',
                'expiry_date' => $upcomingClass->end_session_date->format('d M Y'),
                'days_left' => (int) ceil(Carbon::now()->diffInDays($upcomingClass->end_session_date, false)),
                'branch' => $student->lead->branch->name ?? '-',
                'phone' => $student->lead->phone ?? '-',
            ];
        })->sortBy('days_left')->values();
    }
}
