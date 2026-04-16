<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Actions\Crm\PtExam\CreatePtQuestionGroupAction;
use App\Actions\Crm\PtExam\UpdatePtQuestionGroupAction;
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
            'section_type' => ['nullable', 'string', 'in:reading,speaking,listening'],
            'reading_text' => ['nullable', 'string'],
            'media' => ['nullable', 'file', 'mimes:mp3,wav,mp4,mpeg,pdf,doc,docx,txt,zip,png,jpeg,jpg'],
            'reading_file' => ['nullable', 'file', 'mimes:pdf,doc,docx'],
        ]);

        $validated['pt_exam_id'] = $ptExam->id;

        $action->handle($validated);

        return redirect()->back()->with('success', 'Question group created successfully.');
    }

    public function update(Request $request, PtExam $ptExam, PtQuestionGroup $ptQuestionGroup, UpdatePtQuestionGroupAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'instruction' => ['required', 'string'],
            'section_type' => ['nullable', 'string', 'in:reading,speaking,listening'],
            'reading_text' => ['nullable', 'string'],
            'media' => ['nullable', 'file', 'mimes:mp3,wav,mp4,mpeg,pdf,doc,docx,txt,zip,png,jpeg,jpg'],
            'reading_file' => ['nullable', 'file', 'mimes:pdf,doc,docx'],
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

