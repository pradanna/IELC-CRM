<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ChatTemplate extends Model
{
    use HasUuids;

    protected $fillable = [
        'title',
        'message',
    ];

    public function leadPhases(): BelongsToMany
    {
        return $this->belongsToMany(LeadPhase::class, 'chat_template_lead_phase', 'chat_template_id', 'lead_phase_id')
                    ->withTimestamps();
    }

    public function leadTypes(): BelongsToMany
    {
        return $this->belongsToMany(LeadType::class, 'chat_template_lead_type', 'chat_template_id', 'lead_type_id')
                    ->withTimestamps();
    }
}
