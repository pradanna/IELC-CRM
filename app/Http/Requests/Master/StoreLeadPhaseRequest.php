<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreLeadPhaseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'   => ['required', 'string', 'max:255', 'unique:lead_phases,name'],
            'code'   => ['required', 'string', 'max:100', 'unique:lead_phases,code'],
            'status' => ['required', 'string', 'in:new,prospective,closing,lost'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'   => 'Nama lead phase wajib diisi.',
            'name.unique'     => 'Lead phase dengan nama ini sudah terdaftar.',
            'status.required' => 'Status pipeline wajib dipilih.',
            'status.in'       => 'Status tidak valid.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['code' => Str::slug($this->name ?? '')]);
    }
}
