<?php

namespace App\Actions\Crm\PtExam;

use App\Models\PtSession;
use Illuminate\Support\Str;

class CreatePtSessionAction
{
    public function execute(array $data): PtSession
    {
        // Auto-generate unique token for the magic link if not provided
        if (empty($data['token'])) {
            $data['token'] = Str::random(40);
        }

        return PtSession::create($data);
    }
}
