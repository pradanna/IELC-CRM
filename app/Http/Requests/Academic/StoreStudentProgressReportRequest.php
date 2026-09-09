<?php

namespace App\Http\Requests\Academic;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentProgressReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'file'  => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Judul progress report harus diisi.',
            'file.required'  => 'File progress report harus diunggah.',
            'file.mimes'     => 'Format file harus berupa PDF, JPG, JPEG, PNG, atau WEBP.',
            'file.max'       => 'Ukuran file maksimal 10MB.',
        ];
    }
}
