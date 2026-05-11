<?php

namespace App\Domains\Academic;

use Illuminate\Support\ServiceProvider;
use App\Domains\Academic\Domain\Repositories\StudyClassRepositoryInterface;
use App\Domains\Academic\Infrastructure\Repositories\EloquentStudyClassRepository;

class AcademicServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(StudyClassRepositoryInterface::class, EloquentStudyClassRepository::class);
    }
}
