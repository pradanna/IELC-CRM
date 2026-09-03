<?php

namespace App\Domains\Academic\Application\Actions\PtExam;

use App\Domains\Academic\Domain\Models\PtExam;

class UpdatePtExamAction
{
    public function handle(PtExam $ptExam, array $data): bool
    {
        return $ptExam->update($data);
    }
}
