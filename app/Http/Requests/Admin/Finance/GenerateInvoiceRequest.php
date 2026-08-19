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

    protected function prepareForValidation(): void
    {
        $this->merge([
            'lead_id' => $this->lead_id ?: null,
            'student_id' => $this->student_id ?: null,
            'study_class_id' => $this->study_class_id ?: null,
            'price_master_id' => $this->price_master_id ?: null,
            'join_date' => $this->join_date ?: null,
            'billing_mode' => $this->billing_mode ?: null,
        ]);
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
            'study_class_id' => 'nullable|exists:study_classes,id',
            'price_master_id' => 'nullable|exists:price_masters,id',
            'join_date' => 'nullable|date_format:Y-m-d',
            'billing_mode' => 'nullable|string|in:prorata,full',
            'notes' => 'nullable|string',
            'discount_amount' => 'nullable|integer|min:0',
            'manual_discounts' => 'nullable|array',
            'manual_discounts.*.name' => 'nullable|string|max:255',
            'manual_discounts.*.amount' => 'nullable|integer|min:0',
            'items' => 'nullable|array',
            'items.*.name' => 'required|string|max:255',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
        ];
    }
}


