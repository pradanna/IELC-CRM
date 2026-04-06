<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadGuardian extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'lead_id',
        'role',
        'name',
        'phone',
        'email',
        'occupation',
        'is_main_contact',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
