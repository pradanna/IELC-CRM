<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class StoreMediaAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'file' => ['required', 'file', 'max:10240'], // Max 10MB
        ];
    }
    
    public function messages(): array
    {
        return [
            'name.required' => 'Nama file referensi wajib diisi.',
            'file.required' => 'File wajib diunggah.',
            'file.max'      => 'Ukuran file maksimal 10MB.',
        ];
    }
}
