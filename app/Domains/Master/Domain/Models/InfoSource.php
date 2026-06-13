<?php

namespace App\Domains\Master\Domain\Models;
 
use App\Domains\CRM\Domain\Models\Lead;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class InfoSource extends Model
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
        static::creating(function (InfoSource $infoSource) {
            if (!$infoSource->code) {
                $infoSource->code = Str::slug($infoSource->name);
            }
        });
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }
}
