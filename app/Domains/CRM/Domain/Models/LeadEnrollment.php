<?php

namespace App\Domains\CRM\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadEnrollment extends Model
{
    use HasUuids;

    protected $table = 'lead_enrollments';

    protected $fillable = [
        'lead_id',
        'student_id',
        'study_class_id',
        'invoice_id',
        'joined_at',
        'end_date',
        'stopped_at',
        'status',
        'cycle_number',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'date',
            'end_date' => 'date',
            'stopped_at' => 'date',
            'cycle_number' => 'integer',
        ];
    }

    // --------------------------------------------------------
    // Relationships
    // --------------------------------------------------------

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\Academic\Domain\Models\Student::class);
    }

    public function studyClass(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\Academic\Domain\Models\StudyClass::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\Finance\Domain\Models\Invoice::class);
    }
}

