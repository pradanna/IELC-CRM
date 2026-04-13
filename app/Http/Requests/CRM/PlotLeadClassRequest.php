<?php

namespace App\Http\Requests\CRM;

use Illuminate\Foundation\Http\FormRequest;

class PlotLeadClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'study_class_id' => 'required|exists:study_classes,id',
            'join_date' => 'required|date',
            'notes' => 'nullable|string',
            'estimated_cost' => 'nullable|numeric',
        ];
    }
}
