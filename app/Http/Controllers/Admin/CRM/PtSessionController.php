<?php

namespace App\Http\Controllers\Admin\CRM;

use App\Http\Controllers\Controller;
use App\Models\PtSession;
use App\Models\PtExam;
use App\Models\Lead;
use App\Actions\CRM\PtExam\CreatePtSessionAction;
use App\Http\Resources\CRM\PtExam\PtSessionResource;
use App\Http\Resources\CRM\PtExam\PtExamResource;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PtSessionController extends Controller
{
    public function index()
    {
        $sessions = PtSession::with(['lead', 'ptExam'])->latest()->paginate(10);

        return Inertia::render('Admin/Crm/PtSessions/Index', [
            'sessions' => PtSessionResource::collection($sessions)
        ]);
    }

    public function store(Request $request, CreatePtSessionAction $action)
    {
        $data = $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'pt_exam_id' => 'required|exists:pt_exams,id',
            'scheduled_at' => 'nullable|date',
        ]);

        $session = $action->handle($data);

        return back()->with('success', 'Placement test link generated successfully.');
    }

    public function destroy(PtSession $ptSession)
    {
        $ptSession->delete();

        return back()->with('success', 'Session deleted successfully.');
    }

    public function getResult(PtSession $ptSession)
    {
        $ptSession->load(['answers', 'ptExam.questions.options', 'ptExam.ptQuestionGroups.questions.options']);
        
        $answers = $ptSession->answers->pluck('pt_question_option_id', 'pt_question_id');
        
        return response()->json([
            'session' => new PtSessionResource($ptSession),
            'answers' => $answers,
            'exam' => new PtExamPublicResource($ptSession->ptExam),
        ]);
    }
}
