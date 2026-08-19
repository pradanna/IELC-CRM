<?php

namespace App\Http\Requests\Crm;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'exists:branches,id'],
            'name'       => ['required', 'string', 'max:255'],
            'nickname'   => ['nullable', 'string', 'max:255'],
            'gender'     => ['nullable', 'in:L,P'],
            'phone'      => ['required', 'string', 'max:20', 'regex:/^(\+?62|0)8[1-9][0-9]{7,11}$/'],
            'email'          => ['nullable', 'email', 'unique:leads,email'],
            'lead_source_id' => ['nullable', 'exists:lead_sources,id'],
            'info_source_id' => ['nullable', 'exists:info_sources,id'],
            'lead_type_id'   => ['nullable', 'exists:lead_types,id'],
            'is_online'      => ['boolean'],
            'province'   => ['nullable', 'string'],
            'city'       => ['nullable', 'string'],
            'address'    => ['nullable', 'string'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'birth_date' => ['nullable', 'date'],
            'grade'        => ['nullable', 'string'],
            'school_level' => ['nullable', 'string'],
            
            // Guardians
            'guardians'           => ['nullable', 'array', 'max:5'],
            'guardians.*.role'    => ['required', 'string'], // ayah, ibu, wali
            'guardians.*.name'    => ['required', 'string', 'max:255'],
            'guardians.*.phone'   => ['required', 'string', 'max:20'],
            'guardians.*.email'   => ['nullable', 'email'],
            'guardians.*.is_main_contact' => ['boolean'],

            // Relationships
            'relationships'                       => ['nullable', 'array', 'max:5'],
            'relationships.*.related_lead_id'     => ['required', 'exists:leads,id'],
            'relationships.*.type'                => ['nullable', 'string'],
            'relationships.*.is_main_contact'     => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'branch_id.required' => 'Pilih cabang terlebih dahulu.',
            'name.required'      => 'Nama lengkap wajib diisi.',
            'phone.required'     => 'Nomor telepon wajib diisi.',
            'phone.regex'        => 'Format nomor WhatsApp tidak valid. Gunakan format seperti 081234567890 atau 6281234567890.',
            'email.unique'       => 'Email sudah terdaftar.',
        ];
    }
}



