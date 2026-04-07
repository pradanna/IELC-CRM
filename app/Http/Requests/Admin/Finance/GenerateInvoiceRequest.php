<?php

namespace App\Http\Requests\Admin\Finance;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GenerateInvoiceRequest extends FormRequest
{
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
            'lead_id' => 'required_without:student_id|nullable|exists:leads,id',
            'student_id' => 'required_without:lead_id|nullable|exists:students,id',
            'study_class_id' => 'required|exists:study_classes,id',
            'price_master_id' => 'required|exists:price_masters,id',
            'notes' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.name' => 'required|string|max:255',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
        ];
    }
}
