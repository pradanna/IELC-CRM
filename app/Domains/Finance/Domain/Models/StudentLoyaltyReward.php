<?php

namespace App\Domains\Finance\Domain\Models;

use App\Domains\Academic\Domain\Models\Student;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentLoyaltyReward extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'student_id',
        'tier_name',
        'voucher_name',
        'discount_amount',
        'cafe_points',
        'is_used',
        'used_at',
        'invoice_id',
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'used_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
