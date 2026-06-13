<?php

namespace App\Domains\Shared\Domain\Models;

use App\Domains\Academic\Domain\Models\Teacher;
use App\Domains\CRM\Domain\Models\Marketing;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\Finance;
use App\Domains\Master\Domain\Models\Frontdesk;
use App\Domains\Master\Domain\Models\Superadmin;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, HasRoles, HasUuids, Notifiable;

    protected static function newFactory()
    {
        return \Database\Factories\UserFactory::new();
    }

    protected $appends = ['name'];

    protected $fillable = [
        'email',
        'password',
        'branch_id',
    ];

    public function superadmin(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Superadmin::class);
    }

    public function marketing(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Marketing::class);
    }

    public function frontdesk(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Frontdesk::class);
    }

    public function finance(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Finance::class);
    }

    public function teacher(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Teacher::class);
    }

    public function branch(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function getNameAttribute(): ?string
    {
        return $this->superadmin?->name 
            ?? $this->marketing?->name 
            ?? $this->frontdesk?->name 
            ?? $this->finance?->name
            ?? $this->teacher?->name;
    }

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}

