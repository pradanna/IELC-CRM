<?php

namespace App\Http\Controllers\Admin\CRM;

use App\Actions\CRM\PtExam\CreatePtExamAction;
use App\Actions\CRM\PtExam\DeletePtExamAction;
use App\Actions\CRM\PtExam\UpdatePtExamAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\CRM\PtExam\StorePtExamRequest;
use App\Http\Resources\CRM\PtExam\PtExamResource;
use App\Http\Resources\CRM\PtExam\PtSessionResource;
use App\Models\PtExam;
use App\Models\PtSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PtExamController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'today' => PtSession::whereDate('created_at', now()->today())->count(),
            'in_progress' => PtSession::where('status', 'in_progress')->count(),
            'completed_today' => PtSession::where('status', 'completed')->whereDate('finished_at', now()->today())->count(),
        ];

        $sessions = PtSession::with(['lead', 'ptExam'])
            ->latest()
            ->take(10)
            ->get();

        $exams = PtExam::withCount('questions')
            ->orderBy('title')
            ->get();

        return Inertia::render('Admin/CRM/PlacementTests/Index', [
            'stats' => $stats,
            'sessions' => PtSessionResource::collection($sessions),
            'exams' => PtExamResource::collection($exams),
        ]);
    }

    public function store(StorePtExamRequest $request, CreatePtExamAction $action): RedirectResponse
    {
        $action->handle($request->validated());

        return redirect()->back()->with('success', 'Placement test package created successfully.');
    }

    public function show(PtExam $ptExam): Response
    {
        $ptExam->load([
            'ptQuestionGroups' => function ($q) {
                $q->orderBy('position')->with(['questions' => function ($q2) {
                    $q2->orderBy('position')->with('options');
                }]);
            },
            'questions' => function ($q) {
                $q->whereNull('pt_question_group_id')->orderBy('position')->with('options');
            }
        ]);

        return Inertia::render('Admin/CRM/PlacementTests/Show', [
            'exam' => new PtExamResource($ptExam),
        ]);
    }

    public function update(StorePtExamRequest $request, PtExam $ptExam, UpdatePtExamAction $action): RedirectResponse
    {
        $action->handle($ptExam, $request->validated());

        return redirect()->back()->with('success', 'Placement test package updated successfully.');
    }

    public function destroy(PtExam $ptExam, DeletePtExamAction $action): RedirectResponse
    {
        $action->handle($ptExam);

        return redirect()->route('admin.placement-tests.index')->with('success', 'Placement test package deleted successfully.');
    }
}
