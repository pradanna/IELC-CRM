<?php

namespace App\Actions\CRM\PtExam;

use App\Models\PtExam;

class UpdatePtExamAction
{
    public function handle(PtExam $ptExam, array $data): bool
    {
        return $ptExam->update($data);
    }
}
