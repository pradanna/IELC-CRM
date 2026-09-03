<?php

namespace App\Domains\Academic\Application\Actions\PtExam;

use App\Domains\Academic\Domain\Models\PtExam;
use Illuminate\Validation\ValidationException;

class DeletePtExamAction
{
    public function handle(PtExam $ptExam): bool
    {
        if ($ptExam->ptSessions()->exists()) {
            throw ValidationException::withMessages([
                'exam' => 'Paket ujian tidak dapat dihapus karena sudah memiliki sesi pengerjaan oleh siswa / lead.'
            ]);
        }

        return $ptExam->delete();
    }
}

