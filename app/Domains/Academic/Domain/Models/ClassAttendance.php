<?php

namespace App\Domains\Academic\Domain\Models;

use App\Domains\Shared\Domain\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassAttendance extends Model
{
    use HasUuids;

    protected $fillable = [
        'study_class_id',
        'student_id',
        'recorded_by',
        'cycle_number',
        'session_number',
        'attendance_date',
        'status',
        'topic',
        'notes',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'session_number' => 'integer',
        'cycle_number' => 'integer',
    ];

    public function studyClass(): BelongsTo
    {
        return $this->belongsTo(StudyClass::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
