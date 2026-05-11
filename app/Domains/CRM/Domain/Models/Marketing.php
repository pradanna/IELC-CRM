<?php

namespace App\Domains\CRM\Domain\Models;

use App\Domains\Shared\Domain\Models\User;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Marketing extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'marketing';

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


