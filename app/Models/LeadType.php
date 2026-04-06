<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class LeadType extends Model
{
    use HasUuids;

    protected $fillable = [
        'code',
        'name',
    ];

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function chatTemplates(): BelongsToMany
    {
        return $this->belongsToMany(ChatTemplate::class, 'chat_template_lead_type', 'lead_type_id', 'chat_template_id')
                    ->withTimestamps();
    }
}
