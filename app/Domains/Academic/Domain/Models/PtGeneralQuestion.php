<?php

namespace App\Domains\Academic\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PtGeneralQuestion extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'pt_exam_id',
        'pt_general_question_group_id',
        'number',
        'type',
        'question_text',
        'audio_path',
        'points',
        'position',
    ];

    protected $casts = [
        'number' => 'integer',
        'points' => 'integer',
        'position' => 'integer',
    ];

    public function ptExam(): BelongsTo
    {
        return $this->belongsTo(PtExam::class);
    }

    public function ptGeneralQuestionGroup(): BelongsTo
    {
        return $this->belongsTo(PtGeneralQuestionGroup::class, 'pt_general_question_group_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(PtGeneralQuestionOption::class, 'pt_general_question_id')->orderBy('position');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(PtGeneralAnswer::class, 'pt_general_question_id');
    }
}
