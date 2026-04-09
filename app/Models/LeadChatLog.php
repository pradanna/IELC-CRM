<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadChatLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'lead_id',
        'chat_template_id',
        'lead_phase_id',
        'user_id',
        'message',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(ChatTemplate::class, 'chat_template_id');
    }

    public function phase(): BelongsTo
    {
        return $this->belongsTo(LeadPhase::class, 'lead_phase_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
