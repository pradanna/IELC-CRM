<?php

namespace App\Domains\Academic\Domain\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PtKidCanvas extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pt_kid_canvases';

    protected $fillable = [
        'pt_question_id',
        'mode',
        'instruction',
        'canvas_data',
    ];

    protected $casts = [
        'canvas_data' => 'array',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(PtQuestion::class, 'pt_question_id');
    }
}
