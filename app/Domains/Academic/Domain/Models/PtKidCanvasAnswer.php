<?php

namespace App\Domains\Academic\Domain\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PtKidCanvasAnswer extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pt_kid_canvas_answers';

    protected $fillable = [
        'pt_session_id',
        'pt_question_id',
        'pt_kid_canvas_id',
        'user_mapping',
        'is_correct',
    ];

    protected $casts = [
        'user_mapping' => 'array',
        'is_correct' => 'boolean',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(PtSession::class, 'pt_session_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(PtQuestion::class, 'pt_question_id');
    }

    public function canvas(): BelongsTo
    {
        return $this->belongsTo(PtKidCanvas::class, 'pt_kid_canvas_id');
    }
}
