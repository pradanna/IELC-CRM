<?php

namespace App\Domains\Academic\Domain\Models;

use App\Domains\Master\Domain\Models\Branch;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BranchMonthlyStudentSnapshot extends Model
{
    use HasUuids;

    protected $table = 'branch_monthly_student_snapshots';

    protected $fillable = [
        'branch_id',
        'year',
        'month',
        'group_count',
        'private_count',
        'ielts_count',
        'toefl_count',
        'total_active_count',
        'inactive_count',
        'total_students_count',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
