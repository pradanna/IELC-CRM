<?php

namespace App\Domains\Academic\Domain\Models;

use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Finance\Domain\Models\PriceMaster;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudyClass extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'branch_id',
        'instructor_id',
        'price_master_id',
        'name',
        'start_session_date',
        'end_session_date',
        'total_meetings',
        'meetings_per_week',
        'current_session_number',
        'schedule_days',
    ];

    protected $appends = [
        'session_progress',
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

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'study_class_student')
            ->withPivot('cycle_number')
            ->wherePivot('cycle_number', $this->current_session_number);
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
}

