<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'branch_id' => 'required|exists:branches,id',
            'lead_source_id' => 'nullable|exists:lead_sources,id',
            'lead_type_id' => 'nullable|exists:lead_types,id',
            'is_online' => 'nullable|boolean',
            'province' => 'nullable|string',
            'city' => 'nullable|string',
            
            // Guardians Validation
            'guardians' => 'array',
            'guardians.*.name' => 'required|string|max:255',
            'guardians.*.role' => 'required|string|in:ayah,ibu,wali,kakak,adik,lainnya',
            'guardians.*.phone' => 'required|string|max:20',
            'guardians.*.occupation' => 'nullable|string|max:255',
            'guardians.*.is_main_contact' => 'nullable|boolean',
        ];
    }
}
