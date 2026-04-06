<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Frontdesk extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'frontdesks';

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'address',
        'photo_path',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
