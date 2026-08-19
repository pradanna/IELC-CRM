<?php

namespace App\Domains\Academic\Application\Actions;

use App\Domains\Academic\Domain\Models\StudentProgressReport;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DeleteStudentProgressReport
{
    public function handle(StudentProgressReport $report): bool
    {
        return DB::transaction(function () use ($report) {
            if ($report->file_path && Storage::disk('public')->exists($report->file_path)) {
                Storage::disk('public')->delete($report->file_path);
            }
            return $report->delete();
        });
    }
}
