<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeadConsultation extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'lead_id',
        'user_id',
        'consultation_date',
        'notes',
        'recommended_level',
        'follow_up_note',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'consultation_date' => 'date',
            'metadata' => 'array',
        ];
    }

    // --------------------------------------------------------
    // Relationships
    // --------------------------------------------------------

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function consultant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
