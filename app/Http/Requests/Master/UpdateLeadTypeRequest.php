<?php

namespace App\Http\Requests\Master;

use App\Models\LeadType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateLeadTypeRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        /** @var LeadType $leadType */
        $leadType = $this->route('leadType');

        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('lead_types', 'name')->ignore($leadType->id),
            ],
            'code' => [
                'required', 'string', 'max:100',
                Rule::unique('lead_types', 'code')->ignore($leadType->id),
            ],
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
