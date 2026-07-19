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

        if ($request->filled('type')) {
            $type = strtolower($request->type);
            if ($type === 'group') {
                $query->where(function($q) {
                    $q->where('name', 'like', '%group%')
                      ->orWhere('name', 'like', '%& co%');
                });
            } elseif ($type === 'ielts') {
                $query->where('name', 'like', '%ielts%');
            } elseif ($type === 'online') {
                $query->where('name', 'like', '%online%');
            } elseif ($type === 'offline') {
                $query->where('name', 'like', '%offline%');
            } elseif ($type === 'private') {
                $query->where(function($q) {
                    $q->where('name', 'like', '%private%')
                      ->orWhere('name', 'like', '%privat%')
                      ->orWhere('name', 'like', '%ind -%');
                });
            }
        }

        return [
            'classes_query' => $query->latest(),
            'branches' => Branch::select('id', 'name')->get(),
            'instructors' => User::with(['superadmin', 'marketing', 'frontdesk', 'finance'])->get(),
            'priceMasters' => PriceMaster::select('id', 'name', 'price_per_session')->get(),
        ];
    }
}
