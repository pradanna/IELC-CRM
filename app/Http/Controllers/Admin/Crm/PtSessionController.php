<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Http\Controllers\Controller;
use App\Models\PtSession;
use App\Http\Requests\Crm\PtExam\UpdatePtSessionGradeRequest;
use App\Models\PtExam;
use App\Models\Lead;
use App\Actions\Crm\PtExam\CreatePtSessionAction;
use App\Actions\Crm\PtExam\DeletePtSessionAction;
use App\Actions\Crm\PtExam\GetPtSessionResultAction;
use App\Http\Resources\Crm\PtExam\PtSessionResource;
use App\Http\Resources\Crm\PtExam\PtExamResource;
use App\Http\Resources\Crm\PtExam\PtExamPublicResource;
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

    public function updateGrade(UpdatePtSessionGradeRequest $request, PtSession $ptSession)
    {
        $ptSession->update([
            'final_score' => $request->final_score,
            'recommended_level' => $request->recommended_level,
            'grading_notes' => $request->grading_notes,
            'is_graded' => true,
            'graded_by' => auth()->id(),
        ]);

        return back()->with('success', 'Grading updated successfully.');
    }

    public function getResult(PtSession $ptSession)
    {
        $ptSession->load(['answers', 'ptExam.questions.options', 'ptExam.ptQuestionGroups.questions.options']);
        
        $answers = $ptSession->answers->keyBy('pt_question_id')->map(function ($answer) {
            return [
                'option_id' => $answer->pt_question_option_id,
                'answer_text' => $answer->answer_text,
                'file_path' => $answer->file_path ? \Illuminate\Support\Facades\Storage::url($answer->file_path) : null,
                'is_correct' => $answer->is_correct,
            ];
        });
        
        return response()->json([
            'session' => new PtSessionResource($ptSession),
            'answers' => $answers,
            'exam' => new PtExamPublicResource($ptSession->ptExam),
        ]);
    }
}

