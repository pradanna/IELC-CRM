<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PtQuestionGroup extends Model
{
    /** @use HasFactory<\Database\Factories\PtQuestionGroupFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'pt_exam_id',
        'instruction',
        'section_type',
        'audio_path',
        'file_path',
        'reading_text',
        'position',
    ];

    public function ptExam(): BelongsTo
    {
        return $this->belongsTo(PtExam::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(PtQuestion::class);
    }
}
