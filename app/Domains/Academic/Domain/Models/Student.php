<?php

namespace App\Domains\Academic\Domain\Models;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadEnrollmentPivot;
use App\Domains\Finance\Domain\Models\StudentLoyaltyReward;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        'rejoin_count',
        'loyalty_tier',
        'notes',
        'stopped_at',
    ];

    protected $casts = [
        'start_join' => 'date',
        'stopped_at' => 'date',
        'rejoin_count' => 'integer',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function studyClasses(): BelongsToMany
    {
        return $this->belongsToMany(StudyClass::class, 'lead_enrollments', 'student_id', 'study_class_id')
            ->using(LeadEnrollmentPivot::class)
            ->withPivot(['joined_at', 'end_date', 'status', 'stopped_at'])
            ->withTimestamps();
    }

    public function loyaltyRewards(): HasMany
    {
        return $this->hasMany(StudentLoyaltyReward::class);
    }
}

