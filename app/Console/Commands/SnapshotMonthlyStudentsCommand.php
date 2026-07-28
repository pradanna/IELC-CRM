<?php

namespace App\Console\Commands;

use App\Domains\Academic\Domain\Models\BranchMonthlyStudentSnapshot;
use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Master\Domain\Models\Branch;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SnapshotMonthlyStudentsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'academic:snapshot-monthly-students {--year=} {--month=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calculates and freezes monthly student counts per branch for fast & immutable reporting';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now();
        $targetYear = (int) ($this->option('year') ?: $now->year);
        $targetMonth = (int) ($this->option('month') ?: $now->month);

        $this->info("Processing monthly student snapshot for {$targetYear}-{$targetMonth}...");

        $branches = Branch::all();
        $monthStart = Carbon::create($targetYear, $targetMonth, 1)->startOfMonth();
        $monthEnd = Carbon::create($targetYear, $targetMonth, 1)->endOfMonth();

        foreach ($branches as $branch) {
            $students = Student::whereHas('lead', fn($q) => $q->where('branch_id', $branch->id))
                ->with(['studyClasses', 'lead.leadType'])
                ->where(function($q) use ($monthEnd) {
                    $q->where(function($sq) use ($monthEnd) {
                        $sq->whereNotNull('start_join')
                          ->where('start_join', '<=', $monthEnd);
                    })->orWhere(function($sq) use ($monthEnd) {
                        $sq->whereNull('start_join')
                          ->where('created_at', '<=', $monthEnd);
                    });
                })
                ->where(function($q) use ($monthStart) {
                    $q->whereNull('stopped_at')
                      ->orWhere('stopped_at', '>=', $monthStart);
                })
                ->get();

            $groupCount = 0;
            $privateCount = 0;
            $ieltsCount = 0;
            $toeflCount = 0;
            $inactiveCount = 0;

            foreach ($students as $student) {
                if ($student->status === 'stop' && $student->stopped_at && $student->stopped_at->isBefore($monthEnd)) {
                    $inactiveCount++;
                    continue;
                }

                $classNames = $student->studyClasses->pluck('name')->merge(
                    $student->studyClasses->pluck('category')
                )->merge([$student->lead?->leadType?->name])->filter()->implode(' ');

                $upperNames = strtoupper($classNames);

                if (str_contains($upperNames, 'IELTS')) {
                    $ieltsCount++;
                } elseif (str_contains($upperNames, 'TOEFL')) {
                    $toeflCount++;
                } elseif (str_contains($upperNames, 'PRIVATE') || str_contains($upperNames, '& CO')) {
                    $privateCount++;
                } else {
                    $groupCount++;
                }
            }

            $totalActive = $groupCount + $privateCount + $ieltsCount + $toeflCount;
            $totalStudents = $totalActive + $inactiveCount;

            BranchMonthlyStudentSnapshot::updateOrCreate(
                [
                    'branch_id' => $branch->id,
                    'year'      => $targetYear,
                    'month'     => $targetMonth,
                ],
                [
                    'group_count'          => $groupCount,
                    'private_count'        => $privateCount,
                    'ielts_count'          => $ieltsCount,
                    'toefl_count'          => $toeflCount,
                    'total_active_count'   => $totalActive,
                    'inactive_count'       => $inactiveCount,
                    'total_students_count' => $totalStudents,
                ]
            );

            $this->line("Branch: {$branch->name} -> Active: {$totalActive}, Inactive: {$inactiveCount}");
        }

        $this->info("Snapshot completed successfully!");
        return 0;
    }
}
