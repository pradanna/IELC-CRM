<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PtSession extends Model
{
    /** @use HasFactory<\Database\Factories\PtSessionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'lead_id',
        'pt_exam_id',
        'token',
        'status',
        'scheduled_at',
        'started_at',
        'finished_at',
        'final_score',
        'recommended_level',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'final_score' => 'integer',
        'scheduled_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function ptExam(): BelongsTo
    {
        return $this->belongsTo(PtExam::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(PtAnswer::class);
    }
}
