<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PtAnswer extends Model
{
    /** @use HasFactory<\Database\Factories\PtAnswerFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'pt_session_id',
        'pt_question_id',
        'pt_question_option_id',
        'is_correct',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
    ];

    public function ptSession(): BelongsTo
    {
        return $this->belongsTo(PtSession::class);
    }

    public function ptQuestion(): BelongsTo
    {
        return $this->belongsTo(PtQuestion::class);
    }

    public function ptQuestionOption(): BelongsTo
    {
        return $this->belongsTo(PtQuestionOption::class);
    }
}
