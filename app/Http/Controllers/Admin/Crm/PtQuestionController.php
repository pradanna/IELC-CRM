<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Actions\Crm\PtExam\CreatePtQuestionAction;
use App\Actions\Crm\PtExam\UpdatePtQuestionAction;
use App\Http\Controllers\Controller;
use App\Models\PtExam;
use App\Models\PtQuestion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PtQuestionController extends Controller
{
    public function store(Request $request, PtExam $ptExam, CreatePtQuestionAction $action): RedirectResponse
    {
        $data = $request->all();
        if (isset($data['pt_question_group_id']) && ($data['pt_question_group_id'] === 'null' || $data['pt_question_group_id'] === '')) {
            $data['pt_question_group_id'] = null;
        }

        // Strip MCQ related data if type is not MCQ to avoid validation errors for nullable/null fields
        if (isset($data['type']) && $data['type'] !== 'mcq') {
            unset($data['options'], $data['correct_answer']);
        }

        $validator = Validator::make($data, [
            'pt_question_group_id' => ['nullable', 'exists:pt_question_groups,id'],
            'type' => ['required', 'string', 'in:mcq,text,file'],
            'question_text' => ['required', 'string'],
            'points' => ['required', 'integer', 'min:1'],
            'options' => ['required_if:type,mcq', 'array'],
            'options.*' => ['required_if:type,mcq', 'string'],
            'correct_answer' => ['required_if:type,mcq', 'integer'],
            'media' => ['nullable', 'file', 'mimes:mp3,wav,mp4,mpeg,pdf,doc,docx,txt,zip,png,jpeg,jpg'],
        ]);

        if ($validator->fails()) {
            Log::error('Placement Test Question Validation Failed:', [
                'exam_id' => $ptExam->id,
                'errors' => $validator->errors()->toArray(),
                'payload' => $request->except(['media']),
            ]);
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();
        $validated['pt_exam_id'] = $ptExam->id;

        $action->handle($validated);

        return redirect()->back()->with('success', 'Question added successfully.');
    }

    public function update(Request $request, PtExam $ptExam, PtQuestion $ptQuestion, UpdatePtQuestionAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:mcq,text,file'],
            'question_text' => ['required', 'string'],
            'points' => ['required', 'integer', 'min:1'],
            'options' => ['required_if:type,mcq', 'array'],
            'options.*' => ['required_if:type,mcq', 'string'],
            'correct_answer' => ['required_if:type,mcq', 'integer'],
            'media' => ['nullable', 'file', 'mimes:mp3,wav,mp4,mpeg,pdf,doc,docx,txt,zip,png,jpeg,jpg'],
        ]);

        $action->handle($ptQuestion, $validated);

        return redirect()->back()->with('success', 'Question updated successfully.');
    }

    public function destroy(PtExam $ptExam, PtQuestion $ptQuestion): RedirectResponse
    {
        $ptQuestion->delete();

        return redirect()->back()->with('success', 'Question deleted successfully.');
    }
}

