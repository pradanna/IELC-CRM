<?php

namespace App\Domains\Academic\Domain\Models;

use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Domains\Finance\Domain\Models\Invoice;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudyClass extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'branch_id',
        'instructor_id',
        'price_master_id',
        'name',
        'type',
        'category',
        'status',
        'start_session_date',
        'end_session_date',
        'total_meetings',
        'meetings_per_week',
        'current_session_number',
        'schedule_days',
    ];

    protected $appends = [
        'session_progress',
        'is_expired',
        'is_private',
    ];

    protected $casts = [
        'start_session_date' => 'date',
        'end_session_date' => 'date',
        'schedule_days' => 'array',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function priceMaster(): BelongsTo
    {
        return $this->belongsTo(PriceMaster::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'study_class_id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'lead_enrollments', 'study_class_id', 'student_id')
            ->using(\App\Domains\CRM\Domain\Models\LeadEnrollmentPivot::class)
            ->withPivot(['joined_at', 'end_date', 'status', 'stopped_at'])
            ->withTimestamps();
    }

    /**
     * Automatically calculate the progress (meetings passed) within the current cycle.
     */
    protected function sessionProgress(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->start_session_date || !is_array($this->schedule_days)) {
                    return 0;
                }

                $start = $this->start_session_date;
                $now = now()->startOfDay();

                if ($now->lessThan($start)) {
                    return 0;
                }

                $period = CarbonPeriod::create($start, $now);
                $count = 0;

                foreach ($period as $date) {
                    if (in_array($date->format('l'), $this->schedule_days)) {
                        $count++;
                    }
                }

                return min($count, (int) $this->total_meetings);
            }
        );
    }

    /**
     * Check if class session cycle has ended/expired.
     */
    protected function isExpired(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->end_session_date && $this->end_session_date->endOfDay()->isPast()) {
                    return true;
                }
                if ($this->session_progress >= (int) $this->total_meetings && (int) $this->total_meetings > 0) {
                    return true;
                }
                return false;
            }
        );
    }

    /**
     * Check if class is a private class.
     */
    protected function isPrivate(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->category === 'private'
        );
    }
}

