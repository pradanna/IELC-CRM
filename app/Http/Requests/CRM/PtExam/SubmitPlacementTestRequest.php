<?php

namespace App\Http\Requests\Crm\PtExam;

use Illuminate\Foundation\Http\FormRequest;

class SubmitPlacementTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'answers' => ['nullable', 'array'],
            'answers.*' => ['nullable'], // Option UUID, essay text, or file object
            'summary_file' => ['nullable', 'file', 'mimes:pdf,doc,docx,zip,jpeg,png'],
        ];
    }
}

