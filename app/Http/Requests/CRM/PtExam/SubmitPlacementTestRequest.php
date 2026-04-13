<?php

namespace App\Http\Requests\CRM\PtExam;

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
            'answers' => ['required', 'array'],
            'answers.*' => ['required', 'integer'], // Key is question ID, Value is option ID
        ];
    }
}
