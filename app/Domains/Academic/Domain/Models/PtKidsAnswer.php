<?php

namespace App\Domains\Academic\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PtKidsAnswer extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'pt_session_id',
        'pt_kids_question_id',
        'user_mapping',
        'is_correct',
        'score_earned',
        'teacher_notes',
    ];

    protected $casts = [
        'user_mapping' => 'array',
        'is_correct' => 'boolean',
        'score_earned' => 'float',
    ];

    public function ptSession(): BelongsTo
    {
        return $this->belongsTo(PtSession::class);
    }

    public function ptKidsQuestion(): BelongsTo
    {
        return $this->belongsTo(PtKidsQuestion::class, 'pt_kids_question_id');
    }
}
