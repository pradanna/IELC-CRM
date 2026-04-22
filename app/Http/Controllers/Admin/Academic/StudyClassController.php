<?php

namespace App\Http\Controllers\Admin\Academic;

use App\Actions\Academic\ResetClassCycle;
use App\Actions\Academic\StoreStudyClass;
use App\Actions\Academic\UpdateStudyClass;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Academic\StoreStudyClassRequest;
use App\Http\Requests\Admin\Academic\UpdateStudyClassRequest;
use App\Models\Branch;
use App\Models\StudyClass;
use App\Models\User;
use App\Models\PriceMaster;
use App\Http\Resources\Academic\StudyClassResource;
use App\Http\Resources\Master\BranchResource;
use App\Http\Resources\Finance\PriceMasterResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudyClassController extends Controller
{
    public function index(Request $request): Response
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

        return Inertia::render('Admin/Academic/StudyClass/Index', [
            'classes' => StudyClassResource::collection($query->latest()->get()),
            'branches' => BranchResource::collection(Branch::select('id', 'name')->get()),
            'instructors' => User::with(['superadmin', 'marketing', 'frontdesk', 'finance'])->get(), // Users can be wrapped in UserResource too
            'priceMasters' => PriceMasterResource::collection(PriceMaster::select('id', 'name', 'price_per_session')->get()),
            'filters' => $request->only(['branch_id', 'search']),
        ]);
    }

    public function store(StoreStudyClassRequest $request, StoreStudyClass $action): RedirectResponse
    {
        $action->handle($request->validated());

        return redirect()->back()->with('success', 'Class created successfully.');
    }

    public function update(UpdateStudyClassRequest $request, StudyClass $studyClass, UpdateStudyClass $action): RedirectResponse
    {
        $action->handle($studyClass, $request->validated());

        return redirect()->back()->with('success', 'Class updated successfully.');
    }

    public function resetCycle(StudyClass $studyClass, ResetClassCycle $action): RedirectResponse
    {
        $action->handle($studyClass);

        return redirect()->back()->with('success', "New cycle started for {$studyClass->name}. Keep teaching!");
    }

    public function destroy(StudyClass $studyClass): RedirectResponse
    {
        $studyClass->delete();
        return redirect()->back()->with('success', 'Class deleted successfully.');
    }
}
