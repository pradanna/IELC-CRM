<?php

namespace App\Http\Requests\Admin\Academic;

use Illuminate\Foundation\Http\FormRequest;

class TransferStudentClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from_study_class_id' => ['required', 'string', 'exists:study_classes,id'],
            'to_study_class_id'   => ['required', 'string', 'exists:study_classes,id', 'different:from_study_class_id'],
            'effective_date'      => ['nullable', 'date'],
            'reason'              => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'from_study_class_id.required' => 'Kelas asal wajib dipilih.',
            'from_study_class_id.exists'   => 'Kelas asal tidak ditemukan.',
            'to_study_class_id.required'   => 'Kelas tujuan wajib dipilih.',
            'to_study_class_id.exists'     => 'Kelas tujuan tidak ditemukan.',
            'to_study_class_id.different'  => 'Kelas tujuan harus berbeda dengan kelas asal.',
        ];
    }
}
