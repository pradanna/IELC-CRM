<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PtQuestionOption extends Model
{
    /** @use HasFactory<\Database\Factories\PtQuestionOptionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'pt_question_id',
        'option_text',
        'is_correct',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
    ];

    public function ptQuestion(): BelongsTo
    {
        return $this->belongsTo(PtQuestion::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(PtAnswer::class);
    }
}
