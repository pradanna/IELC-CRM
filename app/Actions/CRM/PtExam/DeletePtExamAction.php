<?php

namespace App\Actions\CRM\PtExam;

use App\Models\PtExam;

class DeletePtExamAction
{
    public function handle(PtExam $ptExam): bool
    {
        return $ptExam->delete();
    }
}
