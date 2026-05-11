<?php

namespace App\Domains\CRM\Application\Actions\PtExam;

use App\Domains\Academic\Domain\Models\PtExam;

class DeletePtExamAction
{
    public function handle(PtExam $ptExam): bool
    {
        return $ptExam->delete();
    }
}



