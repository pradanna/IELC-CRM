<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Http\Controllers\Controller;
use App\Domains\Academic\Domain\Models\PtSession;
use App\Http\Requests\Crm\PtExam\UpdatePtSessionGradeRequest;
use App\Domains\Academic\Domain\Models\PtExam;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Academic\Application\Actions\PtExam\CreatePtSessionAction;
use App\Domains\Academic\Application\Actions\PtExam\GetPtSessionResultAction;
use App\Http\Resources\Crm\PtExam\PtSessionResource;
use App\Http\Resources\Crm\PtExam\PtExamResource;
use App\Http\Resources\Crm\PtExam\PtExamPublicResource;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PtSessionController extends Controller
{
    public function index(Request $request)
    {
        return redirect()->route('admin.placement-tests.index', $request->query());
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
        $ptSession->load([
            'answers',
            'generalAnswers',
            'kidsAnswers',
            'ieltsAnswers',
            'ptExam.questions.options',
            'ptExam.ptQuestionGroups.questions.options',
            'ptExam.generalQuestions.options',
            'ptExam.generalGroups.questions.options',
            'ptExam.kidsQuestions',
            'ptExam.ieltsTasks',
        ]);
        
        $answers = collect();

        // 1. General Answers
        foreach ($ptSession->generalAnswers as $answer) {
            $answers->put($answer->pt_general_question_id, [
                'option_id' => $answer->pt_general_question_option_id,
                'answer_text' => $answer->answer_text,
                'is_correct' => $answer->is_correct,
                'score_earned' => $answer->score_earned,
            ]);
        }

        // 2. Kids Answers
        foreach ($ptSession->kidsAnswers as $answer) {
            $answers->put($answer->pt_kids_question_id, [
                'user_mapping' => $answer->user_mapping,
                'answer_text' => is_array($answer->user_mapping) ? json_encode($answer->user_mapping) : $answer->user_mapping,
                'is_correct' => $answer->is_correct,
                'score_earned' => $answer->score_earned,
                'teacher_notes' => $answer->teacher_notes,
            ]);
        }

        // 3. IELTS Answers
        foreach ($ptSession->ieltsAnswers as $answer) {
            $answers->put($answer->pt_ielts_task_id, [
                'essay_text' => $answer->essay_text,
                'answer_text' => $answer->essay_text,
                'file_path' => $answer->file_path ? \Illuminate\Support\Facades\Storage::url($answer->file_path) : null,
                'score_tr' => $answer->score_tr,
                'score_cc' => $answer->score_cc,
                'score_lr' => $answer->score_lr,
                'score_gra' => $answer->score_gra,
                'band_score' => $answer->band_score,
                'evaluator_notes' => $answer->evaluator_notes,
            ]);
        }

        // 4. Legacy Answers fallback
        foreach ($ptSession->answers as $answer) {
            if (!$answers->has($answer->pt_question_id)) {
                $answers->put($answer->pt_question_id, [
                    'option_id' => $answer->pt_question_option_id,
                    'answer_text' => $answer->answer_text,
                    'file_path' => $answer->file_path ? \Illuminate\Support\Facades\Storage::url($answer->file_path) : null,
                    'is_correct' => $answer->is_correct,
                ]);
            }
        }
        
        return response()->json([
            'session' => new PtSessionResource($ptSession),
            'answers' => $answers,
            'exam' => new PtExamPublicResource($ptSession->ptExam),
        ]);
    }
}



