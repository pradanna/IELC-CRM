<?php

namespace App\Domains\Academic\Application\Actions;

use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudentProgressReport;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class StoreStudentProgressReport
{
    public function handle(Student $student, array $data, UploadedFile $file): StudentProgressReport
    {
        return DB::transaction(function () use ($student, $data, $file) {
            $extension = strtolower($file->getClientOriginalExtension());
            $fileType = $extension === 'pdf' ? 'pdf' : 'image';
            
            $path = $file->store('student_progress_reports', 'public');
            $originalName = $file->getClientOriginalName();

            return $student->progressReports()->create([
                'title'      => $data['title'],
                'file_path'  => $path,
                'file_name'  => $originalName,
                'file_type'  => $fileType,
                'created_by' => auth()->id(),
            ]);
        });
    }
}
