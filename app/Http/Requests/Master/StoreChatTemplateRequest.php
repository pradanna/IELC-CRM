<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class StoreChatTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'         => ['required', 'string', 'max:255'],
            'message'       => ['required', 'string'],
            'target_type'   => ['required', 'string', 'in:global,lead_phase,lead_type'],
            'lead_phase_id' => ['nullable', 'required_if:target_type,lead_phase', 'uuid', 'exists:lead_phases,id'],
            'lead_type_id'  => ['nullable', 'required_if:target_type,lead_type', 'uuid', 'exists:lead_types,id'],
            'file'          => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'], // Max 5MB
        ];
    }
    
    public function messages(): array
    {
        return [
            'title.required'             => 'Judul template wajib diisi.',
            'message.required'           => 'Pesan template wajib diisi.',
            'target_type.required'       => 'Target template wajib dipilih.',
            'lead_phase_id.required_if'  => 'Lead Phase wajib dipilih jika targetnya Lead Phase.',
            'lead_type_id.required_if'   => 'Lead Type wajib dipilih jika targetnya Lead Type.',
            'file.mimes'                 => 'Format file tidak didukung. Gunakan PDF, JPG, JPEG, PNG, atau WEBP.',
            'file.max'                   => 'Ukuran file maksimal 5MB.',
        ];
    }
}
