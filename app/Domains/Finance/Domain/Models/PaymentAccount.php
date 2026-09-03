<?php

namespace App\Domains\Finance\Domain\Models;

use App\Domains\Master\Domain\Models\Branch;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentAccount extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'payment_accounts';

    protected $fillable = [
        'name',
        'type',
        'account_number',
        'account_holder',
        'branch_id',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Optional branch ownership of this payment account.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
