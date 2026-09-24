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
use App\Domains\Academic\Application\Services\PtReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PtSessionController extends Controller
{
    public function index(Request $request)
    {
        return redirect()->route('admin.placement-tests.index', $request->query());
    }

    public function completedList(Request $request)
    {
        $search = $request->query('search');
        $examId = $request->query('exam_id');
        $category = $request->query('category');
        $status = $request->query('status');

        $query = PtSession::with([
            'lead:id,name,phone,branch_id', 
            'lead.branch:id,name', 
            'ptExam:id,title,category',
            'ptExam.questions.kidCanvas',
            'ptExam.kidsQuestions',
            'ptExam.generalQuestions.options',
            'ptExam.generalGroups.questions.options',
            'ptExam.ieltsTasks',
            'kidCanvasAnswers',
            'kidsAnswers',
            'generalAnswers',
            'ieltsAnswers.ptIeltsTask',
            'answers',
        ]);

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->whereHas('lead', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($examId) {
            $query->where('pt_exam_id', $examId);
        }

        if ($category && $category !== 'all') {
            $query->whereHas('ptExam', function ($q) use ($category) {
                $q->where('category', $category);
            });
        }

        $sessions = $query->orderByRaw('COALESCE(finished_at, updated_at, created_at) DESC')->paginate(15);

        return response()->json([
            'data' => PtSessionResource::collection($sessions),
            'pagination' => [
                'current_page' => $sessions->currentPage(),
                'last_page' => $sessions->lastPage(),
                'total' => $sessions->total(),
                'per_page' => $sessions->perPage(),
            ]
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

        $reportData = app(PtReportService::class)->getReportData($ptSession);

        return response()->json([
            'session' => new PtSessionResource($ptSession),
            'answers' => $answers,
            'exam' => new PtExamPublicResource($ptSession->ptExam),
            'ielts_module_scores' => $ieltsModuleScores,
            'stats' => [
                'total_questions' => $reportData['total_targets'],
                'correct_answers' => $reportData['correct_targets'],
                'percentage' => $reportData['percentage'],
                'unit_label' => $reportData['unit_label'],
                'achievement_text' => $reportData['achievement_text'],
            ],
            'download_urls' => [
                'result_pdf' => route('admin.crm.pt-sessions.download-result-pdf', $ptSession->id),
                'answers_pdf' => route('admin.crm.pt-sessions.download-answers-pdf', $ptSession->id),
            ],
        ]);
    }

    /**
     * Download candidate's achievement and score report as a PDF.
     */
    public function downloadResultPdf(PtSession $ptSession, PtReportService $reportService)
    {
        $pdf = $reportService->generateResultPdf($ptSession);
        $safeName = \Illuminate\Support\Str::slug($ptSession->lead?->name ?? 'candidate');
        return $pdf->stream("IELC-PT-Achievement-{$safeName}-{$ptSession->id}.pdf");
    }

    /**
     * Download candidate's full question and answers breakdown as a PDF.
     */
    public function downloadAnswersPdf(PtSession $ptSession, PtReportService $reportService)
    {
        $pdf = $reportService->generateAnswersPdf($ptSession);
        $safeName = \Illuminate\Support\Str::slug($ptSession->lead?->name ?? 'candidate');
        return $pdf->stream("IELC-PT-Answers-{$safeName}-{$ptSession->id}.pdf");
    }

    /**
     * Helper to prepare structured IELTS candidate answer sheet data.
     */
    protected function prepareIeltsAnswerSheetData(PtSession $ptSession): array
    {
        $ptSession->load(['lead.branch', 'ptExam.ieltsTasks', 'ieltsAnswers.ptIeltsTask']);

        $allIeltsTasks = $ptSession->ptExam?->ieltsTasks?->sortBy('position') ?? collect();

        // 1. Listening Tasks
        $listeningTasks = [];
        foreach ($allIeltsTasks->where('skill_type', 'listening') as $task) {
            $ans = $ptSession->ieltsAnswers->firstWhere('pt_ielts_task_id', $task->id);
            $parsedPayload = $ans && is_string($ans->essay_text) ? json_decode($ans->essay_text, true) : null;
            $grid = is_array($parsedPayload) ? ($parsedPayload['grid'] ?? $parsedPayload) : [];

            $totalSlots = 40;
            if (preg_match('/(\d+)\s*questions?/i', $task->title ?? '', $matches)) {
                $totalSlots = (int) $matches[1];
            }

            $filledCount = 0;
            foreach ($grid as $val) {
                if ($val !== null && trim((string)$val) !== '') {
                    $filledCount++;
                }
            }

            $eval = \App\Domains\Academic\Application\Services\IeltsAutoScoringService::gradeListening($grid);

            $listeningTasks[] = [
                'task' => $task,
                'grid' => $grid,
                'total_slots' => $totalSlots,
                'filled_count' => $filledCount,
                'raw_score' => $eval['raw_score'] ?? 0,
                'band_score' => $ans?->band_score ?? ($eval['band_score'] ?? 0),
                'eval' => $eval,
            ];
        }

        // 2. Reading Tasks
        $readingTasks = [];
        foreach ($allIeltsTasks->where('skill_type', 'reading') as $task) {
            $ans = $ptSession->ieltsAnswers->firstWhere('pt_ielts_task_id', $task->id);
            $parsedPayload = $ans && is_string($ans->essay_text) ? json_decode($ans->essay_text, true) : null;
            $grid = is_array($parsedPayload) ? ($parsedPayload['grid'] ?? $parsedPayload) : [];

            $totalSlots = 40;
            if (preg_match('/(\d+)\s*questions?/i', $task->title ?? '', $matches)) {
                $totalSlots = (int) $matches[1];
            }

            $filledCount = 0;
            foreach ($grid as $val) {
                if ($val !== null && trim((string)$val) !== '') {
                    $filledCount++;
                }
            }

            $eval = \App\Domains\Academic\Application\Services\IeltsAutoScoringService::gradeReading($grid);

            $readingTasks[] = [
                'task' => $task,
                'grid' => $grid,
                'total_slots' => $totalSlots,
                'filled_count' => $filledCount,
                'raw_score' => $eval['raw_score'] ?? 0,
                'band_score' => $ans?->band_score ?? ($eval['band_score'] ?? 0),
                'eval' => $eval,
            ];
        }

        // 3. Writing Tasks
        $writingTasks = [];
        foreach ($allIeltsTasks->where('skill_type', 'writing') as $task) {
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

        return [
            'listeningTasks' => $listeningTasks,
            'readingTasks' => $readingTasks,
            'writingTasks' => $writingTasks,
        ];
    }

    /**
     * Download candidate's complete answer sheet as a PDF (Listening, Reading, Writing - excluding Speaking).
     */
    public function downloadWritingPdf(PtSession $ptSession)
    {
        $data = $this->prepareIeltsAnswerSheetData($ptSession);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.ielts_candidate_answersheet', array_merge([
            'session' => $ptSession,
        ], $data));

        $safeName = \Illuminate\Support\Str::slug($ptSession->lead?->name ?? 'candidate');
        return $pdf->stream("IELTS-Answer-Sheet-{$safeName}-{$ptSession->id}.pdf");
    }

    /**
     * Download candidate's complete answer sheet as a Word document (.docx).
     */
    public function downloadWritingDocx(PtSession $ptSession)
    {
        \PhpOffice\PhpWord\Settings::setOutputEscapingEnabled(true);

        if (!class_exists('ZipArchive')) {
            \PhpOffice\PhpWord\Settings::setZipClass(\PhpOffice\PhpWord\Settings::PCLZIP);
        }

        $data = $this->prepareIeltsAnswerSheetData($ptSession);

        $phpWord = new \PhpOffice\PhpWord\PhpWord();
        $phpWord->setDefaultFontName('Calibri');
        $phpWord->setDefaultFontSize(10);

        $section = $phpWord->addSection([
            'marginTop' => 720,
            'marginRight' => 720,
            'marginBottom' => 720,
            'marginLeft' => 720,
        ]);

        $candidateName = $ptSession->lead?->name ?? 'Candidate';
        $branchName = $ptSession->lead?->branch?->name ?? 'Head Office';
        $testTitle = $ptSession->ptExam?->title ?? 'IELTS Placement Test';
        $subDate = $ptSession->finished_at ? \Carbon\Carbon::parse($ptSession->finished_at)->format('d M Y, H:i') : now()->format('d M Y, H:i');

        // Document Title
        $section->addText("CANDIDATE ANSWER SHEET", ['bold' => true, 'size' => 18, 'color' => '0F172A']);
        $section->addText("Listening, Reading & Writing Evaluation", ['size' => 11, 'color' => '64748B']);
        $section->addTextBreak(1);

        // Metadata Table
        $metaTable = $section->addTable(['borderSize' => 6, 'borderColor' => 'CBD5E1', 'cellMargin' => 80]);
        $metaTable->addRow();
        $metaTable->addCell(4800, ['bgColor' => 'F8FAFC'])->addText("Candidate: {$candidateName}", ['bold' => true]);
        $metaTable->addCell(4800, ['bgColor' => 'F8FAFC'])->addText("Branch: {$branchName}", ['bold' => true]);
        $metaTable->addRow();
        $metaTable->addCell(4800)->addText("Test: {$testTitle}");
        $metaTable->addCell(4800)->addText("Submitted: {$subDate}");
        $section->addTextBreak(1);

        // 1. Listening Section
        if (!empty($data['listeningTasks'])) {
            foreach ($data['listeningTasks'] as $taskItem) {
                $title = $taskItem['task']->title ?? 'Listening Section';
                $rawScore = $taskItem['raw_score'] ?? 0;
                $bandScore = $taskItem['band_score'] !== null ? number_format($taskItem['band_score'], 1) : '0.0';

                $section->addText(strtoupper($title), ['bold' => true, 'size' => 13, 'color' => '0369A1']);
                $section->addText("Answered: {$taskItem['filled_count']} of {$taskItem['total_slots']} items  •  Score: {$rawScore} / {$taskItem['total_slots']} (Band {$bandScore})", ['italic' => true, 'size' => 9.5, 'color' => '475569']);
                $section->addTextBreak(1);

                $chunks = array_chunk(range(1, $taskItem['total_slots']), 10);
                foreach ($chunks as $chunk) {
                    $table = $section->addTable(['borderSize' => 6, 'borderColor' => 'CBD5E1', 'cellMargin' => 50]);

                    // Header Row
                    $table->addRow();
                    foreach ($chunk as $num) {
                        $table->addCell(960, ['bgColor' => 'F1F5F9'])->addText("#{$num}", ['bold' => true, 'size' => 8.5], ['alignment' => 'center']);
                    }

                    // Answer & Correctness Row
                    $table->addRow();
                    foreach ($chunk as $num) {
                        $itemEval = $taskItem['eval']['item_results'][$num] ?? null;
                        $isCorrect = $itemEval['is_correct'] ?? false;
                        $userVal = isset($taskItem['grid'][$num]) && trim((string)$taskItem['grid'][$num]) !== '' ? $taskItem['grid'][$num] : '-';
                        $keys = $itemEval['acceptable_keys'] ?? [];
                        $keyStr = is_array($keys) ? implode(' / ', array_slice($keys, 0, 2)) : (string)$keys;

                        $bgColor = $isCorrect ? 'F0FDF4' : ($userVal !== '-' ? 'FEF2F2' : 'F8FAFC');
                        $textColor = $isCorrect ? '16A34A' : ($userVal !== '-' ? 'DC2626' : '64748B');

                        $cell = $table->addCell(960, ['bgColor' => $bgColor]);
                        $cell->addText($userVal, ['bold' => true, 'size' => 8.5, 'color' => $textColor], ['alignment' => 'center']);

                        if ($isCorrect) {
                            $cell->addText("Benar", ['bold' => true, 'size' => 7.5, 'color' => '16A34A'], ['alignment' => 'center']);
                        } else {
                            $cell->addText("Salah", ['bold' => true, 'size' => 7.5, 'color' => 'DC2626'], ['alignment' => 'center']);
                            if (!empty($keyStr)) {
                                $cell->addText("Kunci: {$keyStr}", ['size' => 7, 'color' => '991B1B'], ['alignment' => 'center']);
                            }
                        }
                    }

                    $section->addTextBreak(1);
                }
            }
        }

        // 2. Reading Section
        if (!empty($data['readingTasks'])) {
            foreach ($data['readingTasks'] as $taskItem) {
                $title = $taskItem['task']->title ?? 'Reading Section';
                $rawScore = $taskItem['raw_score'] ?? 0;
                $bandScore = $taskItem['band_score'] !== null ? number_format($taskItem['band_score'], 1) : '0.0';

                $section->addText(strtoupper($title), ['bold' => true, 'size' => 13, 'color' => '15803D']);
                $section->addText("Answered: {$taskItem['filled_count']} of {$taskItem['total_slots']} items  •  Score: {$rawScore} / {$taskItem['total_slots']} (Band {$bandScore})", ['italic' => true, 'size' => 9.5, 'color' => '475569']);
                $section->addTextBreak(1);

                $chunks = array_chunk(range(1, $taskItem['total_slots']), 10);
                foreach ($chunks as $chunk) {
                    $table = $section->addTable(['borderSize' => 6, 'borderColor' => 'CBD5E1', 'cellMargin' => 50]);

                    // Header Row
                    $table->addRow();
                    foreach ($chunk as $num) {
                        $table->addCell(960, ['bgColor' => 'F1F5F9'])->addText("#{$num}", ['bold' => true, 'size' => 8.5], ['alignment' => 'center']);
                    }

                    // Answer & Correctness Row
                    $table->addRow();
                    foreach ($chunk as $num) {
                        $itemEval = $taskItem['eval']['item_results'][$num] ?? null;
                        $isCorrect = $itemEval['is_correct'] ?? false;
                        $userVal = isset($taskItem['grid'][$num]) && trim((string)$taskItem['grid'][$num]) !== '' ? $taskItem['grid'][$num] : '-';
                        $keys = $itemEval['acceptable_keys'] ?? [];
                        $keyStr = is_array($keys) ? implode(' / ', array_slice($keys, 0, 2)) : (string)$keys;

                        $bgColor = $isCorrect ? 'F0FDF4' : ($userVal !== '-' ? 'FEF2F2' : 'F8FAFC');
                        $textColor = $isCorrect ? '16A34A' : ($userVal !== '-' ? 'DC2626' : '64748B');

                        $cell = $table->addCell(960, ['bgColor' => $bgColor]);
                        $cell->addText($userVal, ['bold' => true, 'size' => 8.5, 'color' => $textColor], ['alignment' => 'center']);

                        if ($isCorrect) {
                            $cell->addText("Benar", ['bold' => true, 'size' => 7.5, 'color' => '16A34A'], ['alignment' => 'center']);
                        } else {
                            $cell->addText("Salah", ['bold' => true, 'size' => 7.5, 'color' => 'DC2626'], ['alignment' => 'center']);
                            if (!empty($keyStr)) {
                                $cell->addText("Kunci: {$keyStr}", ['size' => 7, 'color' => '991B1B'], ['alignment' => 'center']);
                            }
                        }
                    }

                    $section->addTextBreak(1);
                }
            }
        }

        // 3. Writing Section
        if (!empty($data['writingTasks'])) {
            $section->addPageBreak();
            $section->addText("WRITING SECTION SUBMISSIONS", ['bold' => true, 'size' => 14, 'color' => 'B45309']);
            $section->addText("Total Writing Tasks: " . count($data['writingTasks']), ['italic' => true, 'size' => 9.5, 'color' => '475569']);
            $section->addTextBreak(1);

            foreach ($data['writingTasks'] as $index => $item) {
                $taskTitle = $item['task']->title ?? ('Writing Task ' . ($index + 1));
                $section->addText($taskTitle, ['bold' => true, 'size' => 12, 'color' => '0F172A']);
                $section->addText("Word Count: {$item['word_count']} words", ['bold' => true, 'size' => 9.5, 'color' => '64748B']);
                if (!empty($item['file_url'])) {
                    $section->addText("Attached Document: {$item['file_url']}", ['italic' => true, 'size' => 9, 'color' => '0284C7']);
                }
                $section->addTextBreak(1);

                $essayText = $item['text'] ? html_entity_decode(strip_tags($item['text']), ENT_QUOTES | ENT_HTML5, 'UTF-8') : '(No text response entered by candidate)';
                $paragraphs = explode("\n", str_replace(["\r\n", "\r"], "\n", $essayText));
                foreach ($paragraphs as $p) {
                    $trimmed = trim($p);
                    if ($trimmed !== '') {
                        $section->addText($trimmed, ['size' => 10.5, 'lineHeight' => 1.3]);
                    } else {
                        $section->addTextBreak(1);
                    }
                }
                $section->addTextBreak(1);
            }
        }

        $safeName = \Illuminate\Support\Str::slug($ptSession->lead?->name ?? 'candidate');
        $fileName = "IELTS-Answer-Sheet-{$safeName}-{$ptSession->id}.docx";
        $tempPath = tempnam(sys_get_temp_dir(), 'ielts_doc_');
        $objWriter = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempPath);

        return response()->download($tempPath, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ])->deleteFileAfterSend(true);
    }
}



