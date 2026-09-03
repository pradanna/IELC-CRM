<?php

namespace App\Domains\Academic\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PtGeneralQuestionGroup extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'pt_exam_id',
        'instruction',
        'reading_text',
        'audio_path',
        'file_path',
        'position',
    ];

    public function ptExam(): BelongsTo
    {
        return $this->belongsTo(PtExam::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(PtGeneralQuestion::class, 'pt_general_question_group_id')->orderBy('position');
    }
}
