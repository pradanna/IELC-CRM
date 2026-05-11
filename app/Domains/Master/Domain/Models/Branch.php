<?php

namespace App\Domains\Master\Domain\Models;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\MonthlyTarget;
use App\Domains\Academic\Domain\Models\Student;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'code',
    ];

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function monthlyTargets(): HasMany
    {
        return $this->hasMany(MonthlyTarget::class);
    }
}

