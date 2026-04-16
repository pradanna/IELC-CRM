<?php

namespace App\Http\Requests\Crm\PtExam;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePtSessionGradeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Permission check can be added here
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'final_score' => 'required|integer|min:0',
            'recommended_level' => 'nullable|string|max:255',
            'grading_notes' => 'nullable|string',
        ];
    }
}

