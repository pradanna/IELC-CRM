<?php

namespace App\Domains\Academic\Domain\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentProgressReport extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'student_id',
        'title',
        'file_path',
        'file_name',
        'file_type',
        'created_by',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
