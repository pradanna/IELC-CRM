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
            'students.lead'
        ])->withCount('students');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        return [
            'classes_query' => $query->latest(),
            'branches' => Branch::select('id', 'name')->get(),
            'instructors' => User::with(['superadmin', 'marketing', 'frontdesk', 'finance'])->get(),
            'priceMasters' => PriceMaster::select('id', 'name', 'price_per_session')->get(),
        ];
    }
}
