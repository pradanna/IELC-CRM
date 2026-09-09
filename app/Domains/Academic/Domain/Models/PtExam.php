<?php

namespace App\Domains\Academic\Domain\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class PtExam extends Model
{
    /** @use HasFactory<\Database\Factories\PtExamFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'title',
        'category',
        'description',
        'slug',
        'duration_minutes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'duration_minutes' => 'integer',
    ];

    protected static function booted()
    {
        static::creating(function ($ptExam) {
            if (empty($ptExam->slug) && !empty($ptExam->title)) {
                $ptExam->slug = Str::slug($ptExam->title);
            }
        });

        static::updating(function ($ptExam) {
            if ($ptExam->isDirty('title')) {
                $ptExam->slug = Str::slug($ptExam->title);
            }
        });
    }

    public function questions(): HasMany
    {
        return $this->hasMany(PtQuestion::class);
    }

    public function ptQuestionGroups(): HasMany
    {
        return $this->hasMany(PtQuestionGroup::class);
    }

    // General Domain Relationships
    public function generalGroups(): HasMany
    {
        return $this->hasMany(PtGeneralQuestionGroup::class, 'pt_exam_id')->orderBy('position');
    }

    public function generalQuestions(): HasMany
    {
        return $this->hasMany(PtGeneralQuestion::class, 'pt_exam_id')->orderBy('position');
    }

    // Kids Domain Relationships
    public function kidsQuestions(): HasMany
    {
        return $this->hasMany(PtKidsQuestion::class, 'pt_exam_id')->orderBy('position');
    }

    // IELTS Domain Relationships (Direct Tasks)
    public function ieltsTasks(): HasMany
    {
        return $this->hasMany(PtIeltsTask::class, 'pt_exam_id')->orderBy('position');
    }

    public function ptSessions(): HasMany
    {
        return $this->hasMany(PtSession::class);
    }
}