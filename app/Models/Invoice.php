<?php

namespace App\Models;

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
        'session_count',
        'status',
        'notes',
    ];

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
}
