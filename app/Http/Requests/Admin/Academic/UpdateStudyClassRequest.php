<?php

namespace App\Http\Requests\Admin\Academic;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudyClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => 'required|exists:branches,id',
            'instructor_id' => 'nullable|exists:users,id',
            'price_master_id' => 'required|exists:price_masters,id',
            'name' => 'required|string|max:255',
            'start_session_date' => 'nullable|date',
            'end_session_date' => 'nullable|date',
            'total_meetings' => 'required|integer|min:1',
            'meetings_per_week' => 'required|integer|min:1',
            'schedule_days' => 'nullable|array',
            'current_session_number' => 'required|integer|min:0',
        ];
    }
}
