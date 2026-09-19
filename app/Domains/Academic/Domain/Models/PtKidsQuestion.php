<?php

namespace App\Domains\Academic\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PtKidsQuestion extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'pt_exam_id',
        'number',
        'mode',
        'instruction',
        'audio_path',
        'canvas_data',
        'points',
        'position',
    ];

    protected $casts = [
        'canvas_data' => 'array',
        'points' => 'integer',
        'position' => 'integer',
    ];

    public function ptExam(): BelongsTo
    {
        return $this->belongsTo(PtExam::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(PtKidsAnswer::class, 'pt_kids_question_id');
    }
}
