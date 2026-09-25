<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Domains\Academic\Application\Actions\PtExam\CreatePtQuestionAction;
use App\Domains\Academic\Application\Actions\PtExam\UpdatePtQuestionAction;
use App\Http\Controllers\Controller;
use App\Domains\Academic\Domain\Models\PtExam;
use App\Domains\Academic\Domain\Models\PtIeltsTask;
use App\Domains\Academic\Domain\Models\PtQuestion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PtQuestionController extends Controller
{
    public function store(Request $request, PtExam $ptExam, CreatePtQuestionAction $action): RedirectResponse
    {
        $data = $request->all();

        // Handle IELTS Category
        if ($ptExam->category === 'IELTS') {
            $validator = Validator::make($data, [
                'skill_type' => ['required', 'string', 'in:listening,reading,writing,speaking'],
                'title' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'min_words' => ['nullable', 'integer'],
                'duration_minutes' => ['nullable', 'integer'],
                'max_score' => ['nullable', 'numeric', 'min:0'],
                'audio' => ['nullable', 'file', 'mimes:mp3,wav,ogg,m4a,aac'],
                'question_pdf' => ['nullable', 'file', 'mimes:pdf,png,jpg,jpeg'],
                'answer_sheet_pdf' => ['nullable', 'file', 'mimes:pdf'],
            ]);

            if ($validator->fails()) {
                return redirect()->back()->withErrors($validator)->withInput();
            }

            $validated = $validator->validated();
            $validated['pt_exam_id'] = $ptExam->id;
            $action->handle($validated);

            return redirect()->back()->with('success', 'Task IELTS berhasil ditambahkan.');
        }

        // Handle General & Kids Category
        if (isset($data['pt_question_group_id']) && ($data['pt_question_group_id'] === 'null' || $data['pt_question_group_id'] === '')) {
            $data['pt_question_group_id'] = null;
        }

        if (isset($data['type']) && $data['type'] !== 'mcq') {
            unset($data['options'], $data['correct_answer']);
        }

        $validator = Validator::make($data, [
            'pt_question_group_id' => ['nullable', 'exists:pt_question_groups,id'],
            'type' => ['required', 'string', 'in:mcq,text,file,drag_drop'],
            'question_text' => ['required', 'string'],
            'points' => ['required', 'integer', 'min:1'],
            'options' => ['required_if:type,mcq', 'array'],
            'options.*' => ['required_if:type,mcq', 'string'],
            'correct_answer' => ['required_if:type,mcq', 'integer'],
            'canvas_data' => ['nullable'],
            'media' => ['nullable', 'file', 'mimes:mp3,wav,mp4,mpeg,pdf,doc,docx,txt,zip,png,jpeg,jpg'],
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();
        $validated['pt_exam_id'] = $ptExam->id;

        $action->handle($validated);

        return redirect()->back()->with('success', 'Question added successfully.');
    }

    public function update(Request $request, PtExam $ptExam, string $questionId, UpdatePtQuestionAction $action): RedirectResponse
    {
        $data = $request->all();

        // Handle IELTS Category
        if ($ptExam->category === 'IELTS') {
            $validator = Validator::make($data, [
                'skill_type' => ['required', 'string', 'in:listening,reading,writing,speaking'],
                'title' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'min_words' => ['nullable', 'integer'],
                'duration_minutes' => ['nullable', 'integer'],
                'max_score' => ['nullable', 'numeric', 'min:0'],
                'audio' => ['nullable', 'file', 'mimes:mp3,wav,ogg,m4a,aac'],
                'question_pdf' => ['nullable', 'file', 'mimes:pdf,png,jpg,jpeg'],
                'answer_sheet_pdf' => ['nullable', 'file', 'mimes:pdf'],
            ]);

            if ($validator->fails()) {
                return redirect()->back()->withErrors($validator)->withInput();
            }

            $action->handle($questionId, $validator->validated());
            return redirect()->back()->with('success', 'Task IELTS berhasil diperbarui.');
        }

        // Handle General & Kids
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:mcq,text,file,drag_drop'],
            'question_text' => ['required', 'string'],
            'points' => ['required', 'integer', 'min:1'],
            'options' => ['required_if:type,mcq', 'array'],
            'options.*' => ['required_if:type,mcq', 'string'],
            'correct_answer' => ['required_if:type,mcq', 'integer'],
            'canvas_data' => ['nullable'],
            'media' => ['nullable', 'file', 'mimes:mp3,wav,mp4,mpeg,pdf,doc,docx,txt,zip,png,jpeg,jpg'],
        ]);

        $action->handle($questionId, $validated);

        return redirect()->back()->with('success', 'Question updated successfully.');
    }

    public function destroy(PtExam $ptExam, string $questionId): RedirectResponse
    {
        if ($ptExam->category === 'IELTS') {
            $task = PtIeltsTask::find($questionId);
            if ($task) $task->delete();
        } else {
            $question = PtQuestion::find($questionId);
            if ($question) $question->delete();
        }

        return redirect()->back()->with('success', 'Deleted successfully.');
    }
}