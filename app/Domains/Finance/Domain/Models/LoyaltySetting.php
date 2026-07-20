<?php

namespace App\Domains\Finance\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltySetting extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tier_name',
        'voucher_name',
        'discount_amount',
        'cafe_points',
        'min_rejoin_count',
        'use_join_date_limit',
        'join_date_limit',
        'join_date_operator',
    ];

    protected $casts = [
        'use_join_date_limit' => 'boolean',
        'join_date_limit' => 'date',
    ];

    /**
     * Check if this loyalty setting matches a student's criteria.
     */
    public function matchesStudent($student): bool
    {
        if ($student->rejoin_count < $this->min_rejoin_count) {
            return false;
        }

        if ($this->use_join_date_limit) {
            if (!$student->start_join) {
                return false;
            }

            $startJoin = \Carbon\Carbon::parse($student->start_join);
            $limit = \Carbon\Carbon::parse($this->join_date_limit);

            if ($this->join_date_operator === 'before') {
                return $startJoin->lt($limit);
            } elseif ($this->join_date_operator === 'after') {
                return $startJoin->gte($limit);
            }
        }

        return true;
    }
}
