<?php

namespace App\Domains\Academic\Application\Actions;

use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use Illuminate\Support\Facades\DB;

class TransferStudentClass
{
    /**
     * Handle the transfer of a student from one study class to another.
     *
     * @param Student $student
     * @param string $fromClassId
     * @param string $toClassId
     * @param string|null $effectiveDate
     * @param string|null $reason
     * @return void
     */
    public function handle(
        Student $student,
        string $fromClassId,
        string $toClassId,
        ?string $effectiveDate = null,
        ?string $reason = null
    ): void {
        DB::transaction(function () use ($student, $fromClassId, $toClassId, $effectiveDate, $reason) {
            $effectiveDate = $effectiveDate ?: now()->toDateString();
            $fromClass = StudyClass::find($fromClassId);
            $toClass = StudyClass::findOrFail($toClassId);

            $fromClassName = $fromClass ? $fromClass->name : 'Unknown Class';
            $toClassName = $toClass->name;

            // 1. Mark existing active enrollment(s) for the old class as stopped/transferred
            $transferNote = "Pindah ke kelas {$toClassName} per {$effectiveDate}" . ($reason ? " (Alasan: {$reason})" : "");

            LeadEnrollment::where('student_id', $student->id)
                ->where('study_class_id', $fromClassId)
                ->whereIn('status', ['active', 'pending_invoice', 'pending_payment'])
                ->update([
                    'status' => 'stopped',
                    'stopped_at' => $effectiveDate,
                    'notes' => DB::raw("CONCAT(COALESCE(notes, ''), IF(COALESCE(notes, '') = '', '', ' | '), '{$transferNote}')"),
                ]);

            // 2. Create / sync new active enrollment in target class
            $student->studyClasses()->syncWithoutDetaching([
                $toClassId => [
                    'lead_id' => $student->lead_id,
                    'joined_at' => $effectiveDate,
                    'end_date' => $toClass->end_session_date?->format('Y-m-d'),
                    'status' => 'active',
                    'cycle_number' => $toClass->current_session_number ?? 1,
                    'notes' => "Pindahan dari kelas {$fromClassName}" . ($reason ? " (Alasan: {$reason})" : ""),
                ]
            ]);

            // 3. Log Activity
            if (function_exists('activity')) {
                activity()
                    ->performedOn($student)
                    ->causedBy(auth()->user())
                    ->withProperties([
                        'from_class_id' => $fromClassId,
                        'from_class_name' => $fromClassName,
                        'to_class_id' => $toClassId,
                        'to_class_name' => $toClassName,
                        'effective_date' => $effectiveDate,
                        'reason' => $reason,
                    ])
                    ->log("Siswa {$student->student_number} dipindahkan dari kelas '{$fromClassName}' ke '{$toClassName}'");
            }
        });
    }
}
