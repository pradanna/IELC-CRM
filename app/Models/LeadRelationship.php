<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadRelationship extends Model
{
    use HasUuids;

    protected $fillable = [
        'lead_id',
        'related_lead_id',
        'type',
        'is_main_contact',
    ];

    protected $casts = [
        'is_main_contact' => 'boolean',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    public function relatedLead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'related_lead_id');
    }
}
