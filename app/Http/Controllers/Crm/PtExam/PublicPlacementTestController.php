<?php

namespace App\Http\Controllers\Crm\PtExam;

use App\Domains\Academic\Application\Actions\PtExam\SubmitPlacementTestAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Crm\PtExam\SubmitPlacementTestRequest;
use App\Http\Resources\Crm\PtExam\PtExamPublicResource;
use App\Http\Resources\Crm\PtExam\PtSessionResource;
use App\Domains\Academic\Domain\Models\PtAnswer;
use App\Domains\Academic\Domain\Models\PtSession;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PublicPlacementTestController extends Controller
{
    public function show(string $token): Response|RedirectResponse
    {
        $session = PtSession::with(['lead', 'ptExam'])
            ->where('token', $token)
            ->firstOrFail();

        if ($session->status === 'completed') {
            return redirect()->route('public.placement-test.result', ['token' => $token]);
        }

        return Inertia::render('Public/PlacementTest/Landing', [
            'session' => [
                'token' => $session->token,
                'status' => $session->status,
                'lead_name' => $session->lead->name ?? 'Student',
            ],
            'exam' => [
                'title' => $session->ptExam->title,
                'description' => $session->ptExam->description,
                'duration_minutes' => $session->ptExam->duration_minutes,
                'slug' => $session->ptExam->slug,
            ]
        ]);
    }

    public function start(string $token): RedirectResponse
    {
        $session = PtSession::where('token', $token)->firstOrFail();

        if ($session->status === 'pending') {
            $session->update([
                'status' => 'in_progress',
                'started_at' => now(),
            ]);
        }

        return redirect()->route('public.placement-test.exam', ['token' => $token]);
    }

    public function exam(string $token): Response|RedirectResponse
    {
        $session = PtSession::with([
            'ptExam.questions.options',
            'ptExam.ptQuestionGroups.questions.options',
            'ptExam.generalQuestions.options',
            'ptExam.generalGroups.questions.options',
            'ptExam.kidsQuestions',
            'ptExam.ieltsTasks',
        ])->where('token', $token)->firstOrFail();

        if ($session->status === 'completed') {
            return redirect()->route('public.placement-test.result', ['token' => $token]);
        }

        $exam = $session->ptExam;

        // Calculate remaining time
        $durationSeconds = $exam->duration_minutes * 60;
        $remainingSeconds = $durationSeconds;

        if ($session->started_at) {
            $elapsed = now()->diffInSeconds($session->started_at);
            $remainingSeconds = max(0, $durationSeconds - $elapsed);
        }

        return Inertia::render('Public/PlacementTest/Exam', [
            'session' => [
                'token' => $session->token,
                'slug' => $exam->slug,
                'remaining_seconds' => $remainingSeconds,
            ],
            'exam_title' => $exam->title,
            'exam_category' => $exam->category,
            'pages' => (new PtExamPublicResource($exam))->toArray(request())['pages'],
        ]);
    }

    public function submit(SubmitPlacementTestRequest $request, string $token, SubmitPlacementTestAction $action): RedirectResponse
    {
        $session = PtSession::where('token', $token)->firstOrFail();

        if ($session->status !== 'completed') {
            $action->handle($session, $request->validated()['answers'] ?? []);
        }

        return redirect()->route('public.placement-test.result', ['token' => $token]);
    }

    public function result(string $token): Response|RedirectResponse
    {
        $session = PtSession::with([
            'lead',
            'ptExam.generalQuestions',
            'ptExam.generalGroups.questions',
            'ptExam.kidsQuestions',
            'ptExam.ieltsTasks',
            'ptExam.questions',
            'ptExam.ptQuestionGroups.questions',
        ])->where('token', $token)->firstOrFail();

        if ($session->status !== 'completed') {
            return redirect()->route('public.placement-test.show', ['token' => $token]);
        }

        $examResource = new PtExamPublicResource($session->ptExam);
        $totalQuestions = $examResource->toArray(request())['total_questions'];
        $category = $session->ptExam->category ?? 'General';

        $correctAnswers = 0;
        if ($category === 'Kids') {
            $correctAnswers = \App\Domains\Academic\Domain\Models\PtKidsAnswer::where('pt_session_id', $session->id)
                ->where('is_correct', true)
                ->count();
        } elseif ($category === 'IELTS') {
            $correctAnswers = \App\Domains\Academic\Domain\Models\PtIeltsAnswer::where('pt_session_id', $session->id)
                ->count();
        } else {
            $generalCorrect = \App\Domains\Academic\Domain\Models\PtGeneralAnswer::where('pt_session_id', $session->id)
                ->where('is_correct', true)
                ->count();
            $legacyCorrect = PtAnswer::where('pt_session_id', $session->id)
                ->where('is_correct', true)
                ->count();
            $correctAnswers = $generalCorrect > 0 ? $generalCorrect : $legacyCorrect;
        }

        return Inertia::render('Public/PlacementTest/Result', [
            'session' => [
                'token' => $session->token,
                'lead_name' => $session->lead->name ?? 'Student',
                'final_score' => $session->final_score,
            ],
            'exam' => [
                'title' => $session->ptExam->title,
                'category' => $session->ptExam->category,
            ],
            'stats' => [
                'total_questions' => $totalQuestions,
                'correct_answers' => $correctAnswers,
            ]
        ]);
    }
}



