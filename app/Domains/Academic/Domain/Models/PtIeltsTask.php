<?php

namespace App\Domains\Academic\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PtIeltsTask extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'pt_exam_id',
        'skill_type',
        'title',
        'description',
        'audio_path',
        'question_pdf_path',
        'answer_sheet_pdf_path',
        'min_words',
        'duration_minutes',
        'max_score',
        'position',
    ];

    protected $casts = [
        'min_words' => 'integer',
        'duration_minutes' => 'integer',
        'max_score' => 'float',
        'position' => 'integer',
    ];

    public function ptExam(): BelongsTo
    {
        return $this->belongsTo(PtExam::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(PtIeltsAnswer::class, 'pt_ielts_task_id');
    }
}