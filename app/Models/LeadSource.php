<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class LeadSource extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'code',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function (LeadSource $leadSource) {
            if (!$leadSource->code) {
                $leadSource->code = Str::slug($leadSource->name);
            }
        });
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }
}
