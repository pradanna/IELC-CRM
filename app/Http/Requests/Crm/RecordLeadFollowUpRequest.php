<?php

namespace App\Http\Requests\Crm;

use Illuminate\Foundation\Http\FormRequest;

class RecordLeadFollowUpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'nullable|string|in:whatsapp,phone,sms,offline_chat,other',
            'message' => 'nullable|string',
        ];
    }
}



