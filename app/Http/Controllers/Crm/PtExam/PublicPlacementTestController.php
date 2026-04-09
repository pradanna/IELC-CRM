<?php

namespace App\Http\Controllers\Crm\PtExam;

use App\Http\Controllers\Controller;
use App\Models\PtSession;
use App\Models\PtAnswer;
use App\Actions\Crm\PtExam\SubmitPlacementTestAction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicPlacementTestController extends Controller
{
    public function show($token)
    {
        $session = PtSession::with(['lead', 'ptExam'])->where('token', $token)->firstOrFail();

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

    public function start($token)
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

    public function exam($token)
    {
        $session = PtSession::with([
            'ptExam.questions.options',
            'ptExam.ptQuestionGroups.questions.options'
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

        // Combine standalone questions & groups
        $items = collect();
        foreach ($exam->questions->whereNull('pt_question_group_id') as $q) {
            $items->push((object)['type' => 'standalone', 'position' => $q->position, 'data' => $q]);
        }
        foreach ($exam->ptQuestionGroups as $g) {
            $items->push((object)['type' => 'group', 'position' => $g->position, 'data' => $g]);
        }
        $items = $items->sortBy('position')->values();

        $pages = [];
        $questionNumber = 1;

        foreach ($items as $item) {
            if ($item->type === 'standalone') {
                $q = $item->data;
                $pages[] = [
                    'id' => 'q_' . $q->id,
                    'type' => 'standalone',
                    'questions' => [[
                        'id' => $q->id,
                        'number' => $questionNumber++,
                        'text' => $q->question_text,
                        'audio_path' => $q->audio_path ? \Illuminate\Support\Facades\Storage::url($q->audio_path) : null,
                        'options' => $q->options->map(fn($o) => ['id' => $o->id, 'text' => $o->option_text]),
                    ]]
                ];
            } else {
                $g = $item->data;
                $groupQuestions = [];
                foreach ($g->questions as $q) {
                    $groupQuestions[] = [
                        'id' => $q->id,
                        'number' => $questionNumber++,
                        'text' => $q->question_text,
                        'audio_path' => $q->audio_path ? \Illuminate\Support\Facades\Storage::url($q->audio_path) : null,
                        'options' => $q->options->map(fn($o) => ['id' => $o->id, 'text' => $o->option_text]),
                    ];
                }
                $pages[] = [
                    'id' => 'g_' . $g->id,
                    'type' => 'group',
                    'instruction' => $g->instruction,
                    'reading_text' => $g->reading_text,
                    'audio_path' => $g->audio_path ? \Illuminate\Support\Facades\Storage::url($g->audio_path) : null,
                    'questions' => $groupQuestions,
                ];
            }
        }

        return Inertia::render('Public/PlacementTest/Exam', [
            'session' => [
                'token' => $session->token,
                'slug' => $exam->slug,
                'remaining_seconds' => $remainingSeconds,
            ],
            'exam_title' => $exam->title,
            'pages' => $pages,
        ]);
    }

    public function submit(Request $request, $token, SubmitPlacementTestAction $action)
    {
        $session = PtSession::where('token', $token)->firstOrFail();

        if ($session->status !== 'completed') {
            $action->execute($session, $request->input('answers', []));
        }

        return redirect()->route('public.placement-test.result', ['token' => $token]);
    }

    public function result($token)
    {
        $session = PtSession::with(['lead', 'ptExam.questions', 'ptExam.ptQuestionGroups.questions'])->where('token', $token)->firstOrFail();

        if ($session->status !== 'completed') {
            return redirect()->route('public.placement-test.show', ['token' => $token]);
        }

        $totalQuestions = $session->ptExam->questions->whereNull('pt_question_group_id')->count();
        foreach ($session->ptExam->ptQuestionGroups as $group) {
            $totalQuestions += $group->questions->count();
        }

        $correctAnswers = PtAnswer::where('pt_session_id', $session->id)->where('is_correct', true)->count();

        return Inertia::render('Public/PlacementTest/Result', [
            'session' => [
                'lead_name' => $session->lead->name ?? 'Student',
                'final_score' => $session->final_score,
            ],
            'exam' => [
                'title' => $session->ptExam->title,
            ],
            'stats' => [
                'total_questions' => $totalQuestions,
                'correct_answers' => $correctAnswers,
            ]
        ]);
    }
}
