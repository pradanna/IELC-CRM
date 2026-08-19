<?php

namespace App\Domains\Academic\Application\Actions;

use App\Domains\CRM\Domain\Models\Lead;
use Illuminate\Support\Facades\DB;

class BulkPromoteStudentsAction
{
    private array $autoDetailedMap = [
        'TK / Paud'   => ['grade' => 'SD', 'school_level' => 'Kelas 1'],
        'TK'          => ['grade' => 'SD', 'school_level' => 'Kelas 1'],
        'Paud'        => ['grade' => 'SD', 'school_level' => 'Kelas 1'],
        'SD 1'        => ['grade' => 'SD', 'school_level' => 'Kelas 2'],
        'SD 2'        => ['grade' => 'SD', 'school_level' => 'Kelas 3'],
        'SD 3'        => ['grade' => 'SD', 'school_level' => 'Kelas 4'],
        'SD 4'        => ['grade' => 'SD', 'school_level' => 'Kelas 5'],
        'SD 5'        => ['grade' => 'SD', 'school_level' => 'Kelas 6'],
        'SD 6'        => ['grade' => 'SMP', 'school_level' => 'Kelas 7'],
        'SMP 7'       => ['grade' => 'SMP', 'school_level' => 'Kelas 8'],
        'SMP 8'       => ['grade' => 'SMP', 'school_level' => 'Kelas 9'],
        'SMP 9'       => ['grade' => 'SMA', 'school_level' => 'Kelas 10'],
        'SMA 10'      => ['grade' => 'SMA', 'school_level' => 'Kelas 11'],
        'SMA 11'      => ['grade' => 'SMA', 'school_level' => 'Kelas 12'],
        'SMA 12'      => ['grade' => 'UMUM', 'school_level' => null],
    ];

    private array $autoLevelMap = [
        'TK / Paud'   => ['grade' => 'SD', 'school_level' => null],
        'TK'          => ['grade' => 'SD', 'school_level' => null],
        'Paud'        => ['grade' => 'SD', 'school_level' => null],
        'SD'          => ['grade' => 'SMP', 'school_level' => null],
        'SMP'         => ['grade' => 'SMA', 'school_level' => null],
        'SMA'         => ['grade' => 'UMUM', 'school_level' => null],
    ];

    public function calculateNext(string $grade, ?string $schoolLevel, string $mode, ?string $customTarget = null): ?array
    {
        $trimmedGrade = trim($grade);
        $trimmedLevel = $schoolLevel ? trim($schoolLevel) : null;

        if ($mode === 'custom' && $customTarget) {
            return $this->parseGradeString($customTarget);
        }

        if ($mode === 'auto_detailed') {
            // Check specific school_level if present (e.g. grade="SD", school_level="Kelas 1" => "SD 1")
            $fullKey = null;
            if ($trimmedLevel && preg_match('/Kelas\s*(\d+)/i', $trimmedLevel, $m)) {
                $fullKey = "{$trimmedGrade} {$m[1]}";
            } else {
                $fullKey = $trimmedGrade;
            }

            if (isset($this->autoDetailedMap[$fullKey])) {
                return $this->autoDetailedMap[$fullKey];
            }

            if (isset($this->autoDetailedMap[$trimmedGrade])) {
                return $this->autoDetailedMap[$trimmedGrade];
            }
        }

        if ($mode === 'auto_level') {
            if (isset($this->autoLevelMap[$trimmedGrade])) {
                return $this->autoLevelMap[$trimmedGrade];
            }
        }

        return null;
    }

    private function parseGradeString(string $targetStr): array
    {
        $targetStr = trim($targetStr);
        if (preg_match('/^(SD|SMP|SMA)\s*(\d+)$/i', $targetStr, $m)) {
            return ['grade' => strtoupper($m[1]), 'school_level' => "Kelas {$m[2]}"];
        }
        if (preg_match('/^(SD|SMP|SMA)$/i', $targetStr)) {
            return ['grade' => strtoupper($targetStr), 'school_level' => null];
        }
        if (stripos($targetStr, 'Kuliah') !== false) {
            return ['grade' => 'KULIAH', 'school_level' => null];
        }
        if (stripos($targetStr, 'Umum') !== false) {
            return ['grade' => 'UMUM', 'school_level' => null];
        }
        return ['grade' => $targetStr, 'school_level' => null];
    }

    public function execute(string $mode, ?string $fromGrade = null, ?string $toGrade = null, ?int $branchId = null, ?array $selectedLeadIds = null): int
    {
        return DB::transaction(function () use ($mode, $fromGrade, $toGrade, $branchId, $selectedLeadIds) {
            $query = Lead::whereHas('student');

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            if (is_array($selectedLeadIds) && count($selectedLeadIds) > 0) {
                $query->whereIn('id', $selectedLeadIds);
            }

            $leads = $query->whereNotNull('grade')->where('grade', '!=', '')->get();
            $updatedCount = 0;

            foreach ($leads as $lead) {
                $next = $this->calculateNext($lead->grade, $lead->school_level, $mode, $toGrade);
                if ($next) {
                    $lead->update([
                        'grade'        => $next['grade'],
                        'school_level' => $next['school_level'],
                    ]);
                    $updatedCount++;
                }
            }

            return $updatedCount;
        });
    }

    public function preview(string $mode, ?string $fromGrade = null, ?string $toGrade = null, ?int $branchId = null): array
    {
        $query = Lead::whereHas('student')->with('student');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($mode === 'custom' && $fromGrade) {
            $query->where('grade', $fromGrade);
        }

        $leads = $query->whereNotNull('grade')->where('grade', '!=', '')->get();
        $studentList = [];
        $breakdown = [];
        $totalAffected = 0;

        foreach ($leads as $lead) {
            $currentGrade = trim($lead->grade);
            $currentLevel = $lead->school_level ? trim($lead->school_level) : null;
            $currentFull = $currentLevel ? "{$currentGrade} ({$currentLevel})" : $currentGrade;

            $next = $this->calculateNext($currentGrade, $currentLevel, $mode, $toGrade);
            if ($next) {
                $nextFull = $next['school_level'] ? "{$next['grade']} ({$next['school_level']})" : $next['grade'];

                $statusLabel = 'valid';
                if ($next['grade'] === 'KULIAH' || $next['grade'] === 'UMUM') {
                    $statusLabel = 'graduated';
                } elseif (!$currentLevel && $mode === 'auto_detailed') {
                    $statusLabel = 'level_missing';
                }

                $studentList[] = [
                    'id'            => $lead->id,
                    'name'          => $lead->name,
                    'student_number'=> $lead->student?->student_number ?? '-',
                    'from_grade'    => $currentGrade,
                    'from_level'    => $currentLevel,
                    'from_full'     => $currentFull,
                    'to_grade'      => $next['grade'],
                    'to_level'      => $next['school_level'],
                    'to_full'       => $nextFull,
                    'status'        => $statusLabel,
                ];

                $key = "{$currentFull} -> {$nextFull}";
                if (!isset($breakdown[$key])) {
                    $breakdown[$key] = ['from' => $currentFull, 'to' => $nextFull, 'count' => 0];
                }
                $breakdown[$key]['count']++;
                $totalAffected++;
            }
        }

        return [
            'total_affected' => $totalAffected,
            'student_list'   => $studentList,
            'preview_list'   => array_values($breakdown),
        ];
    }
}
