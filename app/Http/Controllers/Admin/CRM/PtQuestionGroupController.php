<?php

namespace App\Http\Controllers\Admin\CRM;

use App\Actions\CRM\PtExam\CreatePtQuestionGroupAction;
use App\Actions\CRM\PtExam\UpdatePtQuestionGroupAction;
use App\Http\Controllers\Controller;
use App\Models\PtExam;
use App\Models\PtQuestionGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PtQuestionGroupController extends Controller
{
    public function store(Request $request, PtExam $ptExam, CreatePtQuestionGroupAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'instruction' => ['required', 'string'],
            'reading_text' => ['nullable', 'string'],
            'media' => ['nullable', 'file', 'mimes:mp3,wav,mp4,mpeg'],
        ]);

        $validated['pt_exam_id'] = $ptExam->id;

        $action->handle($validated);

        return redirect()->back()->with('success', 'Question group created successfully.');
    }

    public function update(Request $request, PtExam $ptExam, PtQuestionGroup $ptQuestionGroup, UpdatePtQuestionGroupAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'instruction' => ['required', 'string'],
            'reading_text' => ['nullable', 'string'],
            'media' => ['nullable', 'file', 'mimes:mp3,wav,mp4,mpeg'],
        ]);

        $action->handle($ptQuestionGroup, $validated);

        return redirect()->back()->with('success', 'Question group updated successfully.');
    }

    public function destroy(PtExam $ptExam, PtQuestionGroup $ptQuestionGroup): RedirectResponse
    {
        $ptQuestionGroup->delete();

        return redirect()->back()->with('success', 'Question group deleted successfully.');
    }
}
