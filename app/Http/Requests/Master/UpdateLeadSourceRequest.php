<?php

namespace App\Http\Requests\Master;

use App\Models\LeadSource;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateLeadSourceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        /** @var LeadSource $leadSource */
        $leadSource = $this->route('leadSource');

        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('lead_sources', 'name')->ignore($leadSource->id),
            ],
            'code' => [
                'required', 'string', 'max:100',
                Rule::unique('lead_sources', 'code')->ignore($leadSource->id),
            ],
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
