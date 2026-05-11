<?php

namespace App\Domains\CRM\Domain\Models;
 
use App\Domains\Master\Domain\Models\Branch;


use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlyTarget extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'branch_id',
        'year',
        'month',
        'target_enrolled',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}


