<?php

namespace App\Domains\Academic\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PtGeneralAnswer extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'pt_session_id',
        'pt_general_question_id',
        'pt_general_question_option_id',
        'answer_text',
        'is_correct',
        'score_earned',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'score_earned' => 'integer',
    ];

    public function ptSession(): BelongsTo
    {
        return $this->belongsTo(PtSession::class);
    }

    public function ptGeneralQuestion(): BelongsTo
    {
        return $this->belongsTo(PtGeneralQuestion::class, 'pt_general_question_id');
    }

    public function ptGeneralQuestionOption(): BelongsTo
    {
        return $this->belongsTo(PtGeneralQuestionOption::class, 'pt_general_question_option_id');
    }
}
