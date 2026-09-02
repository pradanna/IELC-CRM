<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Domains\Academic\Application\Actions\PtExam\CreatePtExamAction;
use App\Domains\Academic\Application\Actions\PtExam\DeletePtExamAction;
use App\Domains\Academic\Application\Actions\PtExam\UpdatePtExamAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Crm\PtExam\StorePtExamRequest;
use App\Http\Resources\Crm\PtExam\PtExamResource;
use App\Http\Resources\Crm\PtExam\PtSessionResource;
use App\Domains\Academic\Domain\Models\PtExam;
use App\Domains\Academic\Domain\Models\PtSession;
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

        $exams = PtExam::withCount(['questions', 'ptSessions'])
            ->orderBy('title')
            ->get();

        return Inertia::render('Admin/Crm/PlacementTests/Index', [
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
            'generalGroups.questions.options',
            'generalQuestions.options',
            'kidsQuestions',
            'ieltsTasks',
            'ptQuestionGroups.questions.options',
            'questions.options',
            'questions.kidCanvas',
        ]);

        return Inertia::render('Admin/Crm/PlacementTests/Show', [
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



