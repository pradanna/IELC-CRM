<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;

class Lead extends Model
{
    use HasUuids, LogsActivity, SoftDeletes;

    protected $fillable = [
        'lead_number',
        'name',
        'phone',
        'email',
        'birth_date',
        'branch_id',
        'owner_id',
        'lead_source_id',
        'lead_type_id',
        'lead_phase_id',
        'is_online',
        'province',
        'city',
        'follow_up_count',
        'last_activity_at',
        'enrolled_at',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->useLogName('leads')
            ->setDescriptionForEvent(fn(string $eventName) => "Lead has been {$eventName}");
    }

    protected function casts(): array
    {
        return [
            'is_online' => 'boolean',
            'follow_up_count' => 'integer',
            'last_activity_at' => 'datetime',
            'enrolled_at' => 'datetime',
            'birth_date' => 'date',
        ];
    }

    // --------------------------------------------------------
    // Relationships
    // --------------------------------------------------------

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function leadType(): BelongsTo
    {
        return $this->belongsTo(LeadType::class);
    }

    public function leadPhase(): BelongsTo
    {
        return $this->belongsTo(LeadPhase::class);
    }

    public function leadSource(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class);
    }

    public function crmActivities(): HasMany
    {
        return $this->hasMany(LeadActivity::class);
    }

    public function student(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Student::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function guardians(): HasMany
    {
        return $this->hasMany(LeadGuardian::class);
    }

    public function leadRelationships(): HasMany
    {
        return $this->hasMany(LeadRelationship::class, 'lead_id');
    }

    public function relatedLeads()
    {
        return $this->belongsToMany(Lead::class, 'lead_relationships', 'lead_id', 'related_lead_id')
            ->withPivot('type', 'is_main_contact')
            ->withTimestamps();
    }

    /**
     * Get other leads that share the same guardian phone numbers (Automatic matching).
     */
    public function siblings()
    {
        $guardianPhones = $this->guardians()->pluck('phone')->filter()->toArray();

        if (empty($guardianPhones)) {
            return self::whereRaw('1=0'); // Return empty query
        }

        return self::where('id', '!=', $this->id)
            ->whereHas('guardians', function ($query) use ($guardianPhones) {
                $query->whereIn('phone', $guardianPhones);
            });
    }
}
