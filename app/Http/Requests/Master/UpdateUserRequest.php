<?php

namespace App\Http\Requests\Master;

use App\Support\ValidationPatterns;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:255'],
            'email'     => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($this->route('user')->id)
                    ->whereNull('deleted_at'),
            ],
            'password'  => ['nullable', 'confirmed', Password::defaults()],
            'role'      => ['required', 'string', 'exists:roles,name'],
            'branch_id' => ['required', 'exists:branches,id'],
            'phone'     => ValidationPatterns::phoneRules(false),
            'address'   => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'Nama lengkap wajib diisi.',
            'email.required'     => 'Alamat email wajib diisi.',
            'email.email'        => 'Format email tidak valid (contoh: user@ielc.co.id).',
            'email.unique'       => 'Alamat email ini sudah terdaftar oleh pengguna lain.',
            'role.required'      => 'Silakan pilih role untuk akun staff.',
            'role.exists'        => 'Role yang dipilih tidak valid.',
            'branch_id.required' => 'Silakan pilih cabang utama penempatan staff.',
            'branch_id.exists'   => 'Cabang yang dipilih tidak valid.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'phone.regex'        => ValidationPatterns::PHONE_ID_MESSAGE,
        ];
    }
}


