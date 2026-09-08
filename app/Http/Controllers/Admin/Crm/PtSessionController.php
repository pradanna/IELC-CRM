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

        // If module_bands are provided, update each PtIeltsAnswer's band_score
        if ($request->has('module_bands') && is_array($request->module_bands)) {
            $ptSession->load(['ptExam.ieltsTasks', 'ieltsAnswers']);
            foreach ($request->module_bands as $skill => $band) {
                if ($band === null || $band === '') continue;
                $tasks = $ptSession->ptExam?->ieltsTasks?->where('skill_type', $skill) ?? collect();
                foreach ($tasks as $task) {
                    $answer = $ptSession->ieltsAnswers->firstWhere('pt_ielts_task_id', $task->id);
                    if ($answer) {
                        $answer->update(['band_score' => (float) $band]);
                    } else {
                        \App\Domains\Academic\Domain\Models\PtIeltsAnswer::create([
                            'pt_session_id' => $ptSession->id,
                            'pt_ielts_task_id' => $task->id,
                            'band_score' => (float) $band,
                        ]);
                    }
                }
            }
        }

        return back()->with('success', 'Grading updated successfully.');
    }

    public function getResult(PtSession $ptSession)
    {
        $ptSession->load([
            'answers',
            'generalAnswers',
            'kidsAnswers',
            'kidCanvasAnswers',
            'ieltsAnswers',
            'ptExam.questions.options',
            'ptExam.questions.kidCanvas',
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
        foreach ($ptSession->kidCanvasAnswers as $answer) {
            $answers->put($answer->pt_question_id, [
                'user_mapping' => $answer->user_mapping,
                'answer_text' => is_array($answer->user_mapping) ? json_encode($answer->user_mapping) : $answer->user_mapping,
                'is_correct' => $answer->is_correct,
                'score_earned' => null,
                'teacher_notes' => null,
            ]);
        }

        // 3. IELTS Answers
        foreach ($ptSession->ieltsAnswers as $answer) {
            $task = $answer->ptIeltsTask;
            $parsedPayload = is_string($answer->essay_text) ? json_decode($answer->essay_text, true) : null;
            $gridAnswers = is_array($parsedPayload) ? ($parsedPayload['grid'] ?? $parsedPayload) : [];
            
            $evaluation = null;
            if ($task && $task->skill_type === 'reading' && is_array($gridAnswers)) {
                $evaluation = \App\Domains\Academic\Application\Services\IeltsAutoScoringService::gradeReading($gridAnswers);
            } elseif ($task && $task->skill_type === 'listening' && is_array($gridAnswers)) {
                $evaluation = \App\Domains\Academic\Application\Services\IeltsAutoScoringService::gradeListening($gridAnswers);
            }

            $answers->put($answer->pt_ielts_task_id, [
                'essay_text' => $answer->essay_text,
                'answer_text' => $answer->essay_text,
                'file_path' => ($answer->answer_file_path ?? $answer->file_path) ? \Illuminate\Support\Facades\Storage::url($answer->answer_file_path ?? $answer->file_path) : null,
                'score_tr' => $answer->score_tr,
                'score_cc' => $answer->score_cc,
                'score_lr' => $answer->score_lr,
                'score_gra' => $answer->score_gra,
                'band_score' => $answer->band_score,
                'evaluator_notes' => $answer->teacher_notes ?? $answer->evaluator_notes,
                'evaluation' => $evaluation,
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
        
        // Compute IELTS Module Band Scores if applicable
        $ieltsModuleScores = null;
        if ($ptSession->ptExam?->category === 'IELTS') {
            $listeningBand = null;
            $readingBand = null;
            $writingBand = null;
            $speakingBand = null;

            foreach ($ptSession->ieltsAnswers as $ans) {
                $skill = $ans->ptIeltsTask?->skill_type;
                if ($skill === 'listening') {
                    if ($ans->band_score !== null) {
                        $listeningBand = (float) $ans->band_score;
                    } elseif (isset($answers[$ans->pt_ielts_task_id]['evaluation']['band_score'])) {
                        $listeningBand = (float) $answers[$ans->pt_ielts_task_id]['evaluation']['band_score'];
                    }
                } elseif ($skill === 'reading') {
                    if ($ans->band_score !== null) {
                        $readingBand = (float) $ans->band_score;
                    } elseif (isset($answers[$ans->pt_ielts_task_id]['evaluation']['band_score'])) {
                        $readingBand = (float) $answers[$ans->pt_ielts_task_id]['evaluation']['band_score'];
                    }
                } elseif ($skill === 'writing') {
                    if ($ans->band_score !== null) {
                        $writingBand = (float) $ans->band_score;
                    }
                } elseif ($skill === 'speaking') {
                    if ($ans->band_score !== null) {
                        $speakingBand = (float) $ans->band_score;
                    }
                }
            }

            $ieltsModuleScores = [
                'listening' => $listeningBand,
                'reading' => $readingBand,
                'writing' => $writingBand,
                'speaking' => $speakingBand,
            ];
        }

        return response()->json([
            'session' => new PtSessionResource($ptSession),
            'answers' => $answers,
            'exam' => new PtExamPublicResource($ptSession->ptExam),
            'ielts_module_scores' => $ieltsModuleScores,
        ]);
    }

    /**
     * Download candidate's IELTS Writing answers as a PDF.
     */
    public function downloadWritingPdf(PtSession $ptSession)
    {
        $ptSession->load(['lead.branch', 'ptExam.ieltsTasks', 'ieltsAnswers.ptIeltsTask']);

        // Filter only writing tasks
        $writingTasks = [];
        $ieltsTasks = $ptSession->ptExam?->ieltsTasks?->where('skill_type', 'writing') ?? collect();

        foreach ($ieltsTasks as $task) {
            $answer = $ptSession->ieltsAnswers->firstWhere('pt_ielts_task_id', $task->id);
            $rawText = '';
            $fileUrl = null;

            if ($answer) {
                $payload = is_string($answer->essay_text) ? json_decode($answer->essay_text, true) : null;
                if (is_array($payload) && isset($payload['text'])) {
                    $rawText = $payload['text'];
                } elseif (is_string($answer->essay_text)) {
                    $rawText = $answer->essay_text;
                }

                if ($answer->answer_file_path || $answer->file_path) {
                    $fileUrl = \Illuminate\Support\Facades\Storage::url($answer->answer_file_path ?? $answer->file_path);
                }
            }

            $cleanText = strip_tags($rawText);
            $words = array_filter(preg_split('/\s+/', trim($cleanText)));
            $wordCount = count($words);

            $writingTasks[] = [
                'task' => $task,
                'text' => $rawText,
                'word_count' => $wordCount,
                'file_url' => $fileUrl,
            ];
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.ielts_writing_submission', [
            'session' => $ptSession,
            'writingTasks' => $writingTasks,
        ]);

        $safeName = \Illuminate\Support\Str::slug($ptSession->lead?->name ?? 'candidate');
        return $pdf->stream("IELTS-Writing-{$safeName}-{$ptSession->id}.pdf");
    }
}



