<?php

namespace App\Domains\Academic\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PtGeneralQuestionOption extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'pt_general_question_id',
        'option_text',
        'is_correct',
        'position',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'position' => 'integer',
    ];

    public function ptGeneralQuestion(): BelongsTo
    {
        return $this->belongsTo(PtGeneralQuestion::class, 'pt_general_question_id');
    }
}
