<?php

namespace App\Domains\Academic\Application\Services;

use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Domains\Shared\Domain\Models\User;
use Illuminate\Http\Request;

class StudyClassQueryService
{
    /**
     * Get data for the study class index.
     */
    public function getIndexData(Request $request): array
    {
        $query = StudyClass::with([
            'branch', 
            'instructor.superadmin', 
            'instructor.marketing', 
            'instructor.frontdesk', 
            'instructor.finance', 
            'instructor.teacher',
            'priceMaster', 
            'students.lead',
            'currentCycleAttendances.student.lead',
            'currentCycleAttendances.recorder'
        ])->withCount('students');

        $status = $request->input('status', 'active');
        if ($status !== 'all' && in_array($status, ['active', 'inactive'])) {
            $query->where('status', $status);
        }

        if ($request->filled('session_status')) {
            $today = now()->toDateString();
            if ($request->session_status === 'expired') {
                $query->where(function($q) use ($today) {
                    $q->where('end_session_date', '<', $today);
                });
            } elseif ($request->session_status === 'active_session') {
                $query->where(function($q) use ($today) {
                    $q->whereNull('end_session_date')
                      ->orWhere('end_session_date', '>=', $today);
                });
            }
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->filled('type')) {
            $type = strtolower($request->type);
            if (in_array($type, ['online', 'offline'])) {
                $query->where('type', $type);
            }
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        return [
            'classes_query' => $query->latest(),
            'branches' => Branch::select('id', 'name')->get(),
            'instructors' => User::with(['superadmin', 'marketing', 'frontdesk', 'finance'])->get(),
            'priceMasters' => PriceMaster::select('id', 'name', 'price_per_session')->get(),
            'leadTypes' => \DB::table('lead_types')->select('id', 'code', 'name')->orderBy('name')->get(),
        ];
    }
}
