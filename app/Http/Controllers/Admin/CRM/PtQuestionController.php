<?php

namespace App\Http\Controllers\Admin\CRM;

use App\Actions\Crm\PtExam\CreatePtQuestionAction;
use App\Actions\Crm\PtExam\UpdatePtQuestionAction;
use App\Http\Controllers\Controller;
use App\Models\PtExam;
use App\Models\PtQuestion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PtQuestionController extends Controller
{
    public function store(Request $request, PtExam $ptExam, CreatePtQuestionAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'pt_question_group_id' => ['nullable', 'exists:pt_question_groups,id'],
            'question_text' => ['required', 'string'],
            'points' => ['required', 'integer', 'min:1'],
            'options' => ['required', 'array', 'min:2'],
            'options.*' => ['required', 'string'],
            'correct_answer' => ['required', 'integer'],
            'media' => ['nullable', 'file', 'mimes:mp3,wav,mp4,mpeg'],
        ]);

        $validated['pt_exam_id'] = $ptExam->id;

        $action->execute($validated);

        return redirect()->back()->with('success', 'Question added successfully.');
    }

    public function update(Request $request, PtExam $ptExam, PtQuestion $ptQuestion, UpdatePtQuestionAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'question_text' => ['required', 'string'],
            'points' => ['required', 'integer', 'min:1'],
            'options' => ['required', 'array', 'min:2'],
            'options.*' => ['required', 'string'],
            'correct_answer' => ['required', 'integer'],
            'media' => ['nullable', 'file', 'mimes:mp3,wav,mp4,mpeg'],
        ]);

        $action->execute($ptQuestion, $validated);

        return redirect()->back()->with('success', 'Question updated successfully.');
    }

    public function destroy(PtExam $ptExam, PtQuestion $ptQuestion): RedirectResponse
    {
        $ptQuestion->delete();

        return redirect()->back()->with('success', 'Question deleted successfully.');
    }
}
