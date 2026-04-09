<?php

namespace App\Http\Requests\CRM;

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
            'name'       => ['nullable', 'string', 'max:255'],
            'nickname'   => ['nullable', 'string', 'max:255'],
            'gender'     => ['nullable', 'in:L,P'],
            'phone'      => ['required', 'string', 'max:20'],
            'email'      => ['nullable', 'email', 'unique:leads,email'],
            'lead_type'  => ['nullable', 'string'], // kids, teens, adult, ielts, toefl, toefl_ibt
            'is_online'  => ['boolean'],
            'province'   => ['nullable', 'string'],
            'city'       => ['nullable', 'string'],
            'address'    => ['nullable', 'string'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'birth_date' => ['nullable', 'date'],
            'school'     => ['nullable', 'string', 'max:255'],
            'grade'      => ['nullable', 'string', 'in:PG,TK,SD,SMP,SMA,KULIAH,UMUM'],
            
            // Guardians
            'guardians'           => ['nullable', 'array', 'max:5'],
            'guardians.*.role'    => ['required', 'string'], // ayah, ibu, wali
            'guardians.*.name'    => ['required', 'string', 'max:255'],
            'guardians.*.phone'   => ['required', 'string', 'max:20'],
            'guardians.*.email'   => ['nullable', 'email'],
            'guardians.*.is_main_contact' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'branch_id.required' => 'Pilih cabang terlebih dahulu.',
            'phone.required'     => 'Nomor telepon wajib diisi.',
            'email.unique'       => 'Email sudah terdaftar.',
        ];
    }
}
