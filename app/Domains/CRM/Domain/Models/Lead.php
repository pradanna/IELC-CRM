<?php

namespace App\Domains\CRM\Domain\Models;

use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\PtSession;
use App\Domains\Finance\Domain\Models\Invoice;
use App\Domains\Master\Domain\Models\LeadType;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\Master\Domain\Models\LeadSource;
use App\Domains\Master\Domain\Models\InfoSource;

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
        'nickname',
        'gender',
        'phone',
        'email',
        'birth_date',
        'school',
        'grade',
        'school_level',
        'branch_id',
        'owner_id',
        'created_by',
        'lead_source_id',
        'info_source_id',
        'lead_type_id',
        'lead_phase_id',
        'is_online',
        'province',
        'city',
        'address',
        'postal_code',
        'follow_up_count',
        'last_activity_at',
        'enrolled_at',
        'reached_prospective_at',
        'first_consultation_at',
        'first_pt_at',
        'lost_at',
        'self_registration_token',
        'pending_updates',
        'plotting',
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
            'reached_prospective_at' => 'datetime',
            'first_consultation_at' => 'datetime',
            'first_pt_at' => 'datetime',
            'lost_at' => 'datetime',
            'birth_date' => 'date',
            'pending_updates' => 'array',
            'plotting' => 'json',
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

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
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

    public function infoSource(): BelongsTo
    {
        return $this->belongsTo(InfoSource::class);
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

    public function ptSessions(): HasMany
    {
        return $this->hasMany(PtSession::class);
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(LeadConsultation::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(LeadEnrollment::class);
    }

    public function chatLogs(): HasMany
    {
        return $this->hasMany(LeadChatLog::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(LeadNote::class)->latest();
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LeadActivity::class)->latest();
    }


    protected static function booted()
    {
        static::creating(function ($lead) {
            if (!$lead->self_registration_token) {
                $lead->self_registration_token = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}

