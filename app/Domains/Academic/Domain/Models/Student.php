<?php

namespace App\Domains\Academic\Domain\Models;

use App\Domains\CRM\Domain\Models\Lead;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'lead_id',
        'student_number',
        'profile_picture',
        'start_join',
        'status',
        'notes',
        'stopped_at',
    ];

    protected $casts = [
        'start_join' => 'date',
        'stopped_at' => 'date',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function studyClasses(): BelongsToMany
    {
        return $this->belongsToMany(StudyClass::class, 'study_class_student');
    }
}

