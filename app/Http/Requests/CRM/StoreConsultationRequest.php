<?php

namespace App\Http\Requests\CRM;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreConsultationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
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
            'consultation_date' => ['required', 'date'],
            'notes'             => ['nullable', 'string'],
            'recommended_level' => ['nullable', 'string', 'max:100'],
            'follow_up_note'    => ['nullable', 'string'],
        ];
    }
}
