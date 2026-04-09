<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PtQuestion extends Model
{
    /** @use HasFactory<\Database\Factories\PtQuestionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'pt_exam_id',
        'pt_question_group_id',
        'question_text',
        'audio_path',
        'points',
        'number',
        'position',
    ];

    protected $casts = [
        'points' => 'integer',
    ];

    public function ptExam(): BelongsTo
    {
        return $this->belongsTo(PtExam::class);
    }

    public function ptQuestionGroup(): BelongsTo
    {
        return $this->belongsTo(PtQuestionGroup::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(PtQuestionOption::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(PtAnswer::class);
    }
}
