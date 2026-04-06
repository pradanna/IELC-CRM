<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreLeadSourceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:lead_sources,name'],
            'code' => ['required', 'string', 'max:100', 'unique:lead_sources,code'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama lead source wajib diisi.',
            'name.unique'   => 'Lead source dengan nama ini sudah terdaftar.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['code' => Str::slug($this->name ?? '')]);
    }
}
