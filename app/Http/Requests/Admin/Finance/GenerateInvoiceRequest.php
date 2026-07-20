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
            'join_date' => 'required|date_format:Y-m-d',
            'billing_mode' => 'required|string|in:prorata,full',
            'notes' => 'nullable|string',
            'discount_amount' => 'nullable|integer|min:0',
            'loyalty_reward_id' => [
                'nullable',
                'uuid',
                'exists:student_loyalty_rewards,id',
                function ($attribute, $value, $fail) {
                    $reward = \Illuminate\Support\Facades\DB::table('student_loyalty_rewards')->where('id', $value)->first();
                    if ($reward) {
                        if ($reward->is_used) {
                            $fail('Voucher ini sudah pernah digunakan.');
                        }
                        if ($this->student_id && $reward->student_id !== $this->student_id) {
                            $fail('Voucher ini bukan milik student yang bersangkutan.');
                        }
                    }
                }
            ],
            'items' => 'nullable|array',
            'items.*.name' => 'required|string|max:255',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
        ];
    }
}


