<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class LeadPhase extends Model
{
    use HasUuids;

    protected $fillable = [
        'code',
        'name',
        'status',
    ];

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function chatTemplates(): BelongsToMany
    {
        return $this->belongsToMany(ChatTemplate::class, 'chat_template_lead_phase', 'lead_phase_id', 'chat_template_id')
                    ->withTimestamps();
    }
}
