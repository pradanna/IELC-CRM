<?php

namespace App\Http\Requests\Crm;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id'      => ['required', 'exists:branches,id'],
            'name'           => ['required', 'string', 'max:255'],
            'nickname'       => ['nullable', 'string', 'max:255'],
            'gender'         => ['nullable', 'in:L,P'],
            'phone'          => ['required', 'string', 'max:20'],
            'email'          => ['nullable', 'email', 'unique:leads,email,' . $this->route('lead')->id],
            'lead_source_id' => ['nullable', 'exists:lead_sources,id'],
            'lead_type_id'   => ['nullable', 'exists:lead_types,id'],
            'is_online'      => ['boolean'],
            'province'       => ['nullable', 'string'],
            'city'           => ['nullable', 'string'],
            'address'        => ['nullable', 'string'],
            'postal_code'    => ['nullable', 'string', 'max:10'],
            'birth_date'     => ['nullable', 'date'],
            'school'         => ['nullable', 'string', 'max:255'],
            'grade'          => ['nullable', 'string', 'in:PG,TK,SD,SMP,SMA,KULIAH,UMUM'],
            'notes'          => ['nullable', 'string'],
            
            // Guardians
            'guardians'           => ['nullable', 'array', 'max:5'],
            'guardians.*.role'    => ['required', 'string'],
            'guardians.*.name'    => ['required', 'string', 'max:255'],
            'guardians.*.phone'   => ['required', 'string', 'max:20'],
            'guardians.*.email'   => ['nullable', 'email'],
            'guardians.*.is_main_contact' => ['boolean'],

            // Relationships
            'relationships'                       => ['nullable', 'array', 'max:5'],
            'relationships.*.related_lead_id'     => ['required', 'exists:leads,id'],
            'relationships.*.type'                => ['required', 'string'],
            'relationships.*.is_main_contact'     => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'branch_id.required' => 'Pilih cabang terlebih dahulu.',
            'name.required'      => 'Nama lengkap wajib diisi.',
            'phone.required'     => 'Nomor telepon wajib diisi.',
            'email.unique'       => 'Email sudah terdaftar.',
        ];
    }
}

