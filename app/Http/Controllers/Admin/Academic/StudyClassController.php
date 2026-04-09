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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudyClassController extends Controller
{
    public function index(Request $request): Response
    {
        $query = StudyClass::with(['branch', 'instructor', 'priceMaster', 'students' => function ($q) {
            $q->with('lead'); // We need student name from Lead
        }])->withCount('students');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        return Inertia::render('Admin/Academic/StudyClass/Index', [
            'classes' => $query->latest()->get(),
            'branches' => Branch::select('id', 'name')->get(),
            'instructors' => User::with(['superadmin', 'marketing', 'frontdesk', 'finance'])->get(), 
            'priceMasters' => \App\Models\PriceMaster::select('id', 'name', 'price_per_session')->get(),
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
