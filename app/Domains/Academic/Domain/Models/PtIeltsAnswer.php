<?php

namespace App\Domains\Academic\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PtIeltsAnswer extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'pt_session_id',
        'pt_ielts_task_id',
        'answer_file_path',
        'essay_text',
        'score_tr',
        'score_cc',
        'score_lr',
        'score_gra',
        'band_score',
        'teacher_notes',
    ];

    protected $casts = [
        'score_tr' => 'float',
        'score_cc' => 'float',
        'score_lr' => 'float',
        'score_gra' => 'float',
        'band_score' => 'float',
    ];

    public function ptSession(): BelongsTo
    {
        return $this->belongsTo(PtSession::class);
    }

    public function ptIeltsTask(): BelongsTo
    {
        return $this->belongsTo(PtIeltsTask::class, 'pt_ielts_task_id');
    }
}