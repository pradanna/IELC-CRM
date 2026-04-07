<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, HasUuids, Notifiable;

    /**
     * Attributes to append to the model's array/JSON form.
     *
     * @var array
     */
    protected $appends = ['name'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'password',
        'branch_id',
    ];

    /**
     * Staff Profile Relationships
     */
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

    /**
     * Virtual name attribute that delegates to the active profile.
     */
    public function getNameAttribute(): ?string
    {
        return $this->superadmin?->name 
            ?? $this->marketing?->name 
            ?? $this->frontdesk?->name 
            ?? $this->finance?->name
            ?? $this->teacher?->name;
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
