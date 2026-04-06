<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreLeadTypeRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:lead_types,name'],
            'code' => ['required', 'string', 'max:100', 'unique:lead_types,code'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama lead type wajib diisi.',
            'name.unique'   => 'Lead type dengan nama ini sudah terdaftar.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['code' => Str::slug($this->name ?? '')]);
    }
}
