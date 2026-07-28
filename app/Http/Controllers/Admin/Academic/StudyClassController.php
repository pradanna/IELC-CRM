<?php

namespace App\Http\Controllers\Admin\Academic;

use App\Domains\Academic\Application\Actions\ResetClassCycle;
use App\Domains\Academic\Application\Actions\StoreStudyClass;
use App\Domains\Academic\Application\Actions\UpdateStudyClass;
use App\Domains\Academic\Application\Services\StudyClassQueryService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Academic\StoreStudyClassRequest;
use App\Http\Requests\Admin\Academic\UpdateStudyClassRequest;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Http\Resources\Academic\StudyClassResource;
use App\Http\Resources\Master\BranchResource;
use App\Http\Resources\Finance\PriceMasterResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudyClassController extends Controller
{
    public function index(Request $request, StudyClassQueryService $service): Response
    {
        $data = $service->getIndexData($request);

        return Inertia::render('Admin/Academic/StudyClass/Index', [
            'classes' => StudyClassResource::collection($data['classes_query']->paginate(12)->withQueryString()),
            'branches' => BranchResource::collection($data['branches']),
            'instructors' => $data['instructors'], 
            'priceMasters' => PriceMasterResource::collection($data['priceMasters']),
            'filters' => array_merge(['status' => 'active', 'session_status' => '', 'category' => ''], $request->only(['branch_id', 'search', 'type', 'category', 'status', 'session_status'])),
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

    public function resetCycle(Request $request, StudyClass $studyClass, ResetClassCycle $action): RedirectResponse
    {
        $request->validate([
            'start_session_date' => 'required|date',
            'end_session_date' => 'required|date|after_or_equal:start_session_date',
        ], [
            'start_session_date.required' => 'Tanggal mulai wajib diisi.',
            'end_session_date.required' => 'Tanggal selesai wajib diisi.',
            'end_session_date.after_or_equal' => 'Tanggal selesai harus setelah atau sama dengan tanggal mulai.',
        ]);

        $action->handle(
            $studyClass,
            $request->input('start_session_date'),
            $request->input('end_session_date')
        );

        return redirect()->back()->with('success', "New cycle started for {$studyClass->name}. Keep teaching!");
    }

    public function destroy(StudyClass $studyClass): RedirectResponse
    {
        $studyClass->delete();
        return redirect()->back()->with('success', 'Class deleted successfully.');
    }
}


