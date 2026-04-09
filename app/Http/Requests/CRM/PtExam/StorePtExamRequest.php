<?php

namespace App\Http\Requests\Crm\PtExam;

use Illuminate\Foundation\Http\FormRequest;

class StorePtExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'is_active' => ['boolean'],
        ];
    }
}
