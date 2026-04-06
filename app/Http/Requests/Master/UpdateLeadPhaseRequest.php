<?php

namespace App\Http\Requests\Master;

use App\Models\LeadPhase;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateLeadPhaseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        /** @var LeadPhase $leadPhase */
        $leadPhase = $this->route('leadPhase');

        return [
            'name'   => [
                'required', 'string', 'max:255',
                Rule::unique('lead_phases', 'name')->ignore($leadPhase->id),
            ],
            'code'   => [
                'required', 'string', 'max:100',
                Rule::unique('lead_phases', 'code')->ignore($leadPhase->id),
            ],
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
