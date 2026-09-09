<?php

namespace App\Domains\Finance\Domain\Models;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'invoice_number',
        'lead_id',
        'student_id',
        'study_class_id',
        'total_amount',
        'discount_amount',
        'session_count',
        'start_date',
        'status',
        'payment_method',
        'due_date',
        'paid_at',
        'notes',
        'discount_breakdown',
        'type',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'paid_at'  => 'datetime',
            'start_date' => 'date',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function studyClass(): BelongsTo
    {
        return $this->belongsTo(StudyClass::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoicedItem::class);
    }

    public function loyaltyRewards(): HasMany
    {
        return $this->hasMany(StudentLoyaltyReward::class);
    }
}

