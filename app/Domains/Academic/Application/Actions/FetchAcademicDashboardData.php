<?php

namespace App\Domains\Academic\Application\Actions;

use App\Domains\Academic\Domain\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FetchAcademicDashboardData
{
    public function handle(array $params = []): array
    {
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';

        $year  = isset($params['year']) ? (int) $params['year'] : (int) now()->year;
        $month = isset($params['month']) && $params['month'] !== '' ? (int) $params['month'] : null;
        $modeFilter = $params['mode'] ?? null; // 'offline', 'online', or null
        $branchId   = $params['branch_id'] ?? null;
        $activeTab  = $params['tab'] ?? 'overall';

        // ── Available years ──────────────────────────────────────
        $yearExpr        = $isSqlite ? "cast(strftime('%Y', start_join) as integer)" : "YEAR(start_join)";
        $stoppedYearExpr = $isSqlite ? "cast(strftime('%Y', stopped_at) as integer)" : "YEAR(stopped_at)";

        $startYears = Student::selectRaw("DISTINCT {$yearExpr} as yr")
            ->whereNotNull('start_join')->pluck('yr')->filter()->toArray();

        $stopYears = Student::selectRaw("DISTINCT {$stoppedYearExpr} as yr")
            ->whereNotNull('stopped_at')->pluck('yr')->filter()->toArray();

        $availableYears = collect(array_merge($startYears, $stopYears, [(int) now()->year]))
            ->unique()->sortDesc()->values()->map(fn($v) => (int) $v)->toArray();

        if (!in_array($year, $availableYears)) {
            $availableYears[] = $year;
            rsort($availableYears);
        }

        // ── Helper: apply year/month date filter ─────────────────
        $filterByDate = function ($query, string $col, int $y, ?int $m = null) use ($isSqlite) {
            if ($isSqlite) {
                $query->whereRaw("cast(strftime('%Y', {$col}) as integer) = ?", [$y]);
                if ($m) {
                    $query->whereRaw("cast(strftime('%m', {$col}) as integer) = ?", [$m]);
                }
            } else {
                $query->whereYear($col, $y);
                if ($m) {
                    $query->whereMonth($col, $m);
                }
            }
            return $query;
        };

        // ═════════════════════════════════════════════════════════
        // 1. OVERALL
        // ═════════════════════════════════════════════════════════

        // Total active students (all active students across all years)
        $totalActiveStudents = Student::where('status', 'active')->count();

        // New students joined in target month/year
        $targetMonth = $month ?? (int) now()->month;
        $newStudentsQuery = Student::where('status', 'active');
        $filterByDate($newStudentsQuery, 'start_join', $year, $targetMonth);
        $newStudentsThisMonth = $newStudentsQuery->count();

        // Monthly trend (full year – ignores month filter for the chart)
        $dateFormat = $isSqlite
            ? "strftime('%Y-%m', start_join)"
            : "DATE_FORMAT(start_join, '%Y-%m')";

        $monthlyTrendQuery = Student::where('status', 'active')
            ->whereNotNull('start_join')
            ->selectRaw("{$dateFormat} as month, count(*) as count")
            ->groupBy('month')
            ->orderBy('month', 'asc');
        $filterByDate($monthlyTrendQuery, 'start_join', $year);
        $monthlyTrendRaw = $monthlyTrendQuery->get();

        $monthlyTrend = [];
        foreach ($monthlyTrendRaw as $row) {
            if (!$row->month) continue;
            try {
                $monthlyTrend[] = [
                    'month'    => Carbon::createFromFormat('Y-m', $row->month)->format('M Y'),
                    'students' => (int) $row->count,
                ];
            } catch (\Exception $e) {
                $monthlyTrend[] = [
                    'month'    => $row->month,
                    'students' => (int) $row->count,
                ];
            }
        }

        // Online vs Offline breakdown
        $channelCounts = Student::where('students.status', 'active')
            ->leftJoin('lead_enrollments', function ($join) {
                $join->on('students.id', '=', 'lead_enrollments.student_id')
                     ->where('lead_enrollments.status', '=', 'active');
            })
            ->leftJoin('study_classes', 'lead_enrollments.study_class_id', '=', 'study_classes.id')
            ->leftJoin('leads', 'students.lead_id', '=', 'leads.id')
            ->selectRaw("
                sum(case 
                    when study_classes.type = 'online' then 1 
                    when study_classes.type is null and leads.is_online = 1 then 1 
                    else 0 
                end) as online_count,
                sum(case 
                    when study_classes.type = 'offline' then 1 
                    when study_classes.type is null and (leads.is_online = 0 or leads.is_online is null) then 1 
                    when study_classes.type is not null and study_classes.type != 'online' then 1
                    else 0 
                end) as offline_count
            ");
        $channelData = $channelCounts->first();

        $onlineCount = (int) ($channelData->online_count ?? 0);
        $offlineCount = (int) ($channelData->offline_count ?? 0);

        // Grade distribution
        $gradeQuery = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->selectRaw("COALESCE(leads.grade, 'UMUM') as raw_grade, leads.school_level as school_level, count(*) as count")
            ->groupBy('raw_grade', 'school_level');
        $filterByDate($gradeQuery, 'students.start_join', $year);
        $gradeDistributionRaw = $gradeQuery->get();

        $gradeGroups = [
            'PG' => 0, 'TK' => 0, 'SD' => 0, 'SMP' => 0, 'SMA' => 0, 'UMUM' => 0
        ];

        foreach ($gradeDistributionRaw as $item) {
            $rawGrade = strtoupper(trim($item->raw_grade));
            if (str_contains($rawGrade, 'PG') || str_contains($rawGrade, 'PLAYGROUP') || str_contains($rawGrade, 'KB')) {
                $gradeGroups['PG'] += $item->count;
            } elseif (str_contains($rawGrade, 'TK')) {
                $gradeGroups['TK'] += $item->count;
            } elseif (str_contains($rawGrade, 'SD')) {
                $gradeGroups['SD'] += $item->count;
            } elseif (str_contains($rawGrade, 'SMP')) {
                $gradeGroups['SMP'] += $item->count;
            } elseif (str_contains($rawGrade, 'SMA') || str_contains($rawGrade, 'SMK') || str_contains($rawGrade, 'SLTA')) {
                $gradeGroups['SMA'] += $item->count;
            } else {
                $gradeGroups['UMUM'] += $item->count;
            }
        }

        $overallGradeDistribution = [];
        foreach ($gradeGroups as $label => $count) {
            $overallGradeDistribution[] = [
                'name'  => $label,
                'count' => (int) $count,
            ];
        }

        // Branch distribution
        $branchQuery = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->join('branches', 'leads.branch_id', '=', 'branches.id')
            ->selectRaw('branches.name as branch_name, count(*) as count')
            ->groupBy('branches.name');
        $branchDistribution = $branchQuery->get()->map(fn($item) => [
            'name'  => $item->branch_name,
            'value' => (int) $item->count,
        ]);

        // ═════════════════════════════════════════════════════════
        // 2. POLA JOIN
        // ═════════════════════════════════════════════════════════

        $availableBranches = DB::table('branches')->select('id', 'name')->orderBy('name')->get();

        $monthExpr = $isSqlite
            ? "CAST(strftime('%m', le.joined_at) AS INTEGER)"
            : "MONTH(le.joined_at)";

        $yearExprLE = $isSqlite
            ? "CAST(strftime('%Y', le.joined_at) AS INTEGER)"
            : "YEAR(le.joined_at)";

        $joinQueryBuilder = DB::table('lead_enrollments as le')
            ->join('study_classes as sc', 'le.study_class_id', '=', 'sc.id')
            ->join('price_masters as pm', 'sc.price_master_id', '=', 'pm.id')
            ->leftJoin('leads as l', 'le.lead_id', '=', 'l.id')
            ->selectRaw("
                {$monthExpr}   AS month_num,
                pm.name        AS package_name,
                sc.type        AS delivery_mode,
                COUNT(le.id)   AS student_count
            ")
            ->whereRaw("{$yearExprLE} = ?", [$year]);

        if ($month) {
            $joinQueryBuilder->whereRaw("{$monthExpr} = ?", [$month]);
        }

        if ($modeFilter && in_array($modeFilter, ['online', 'offline'])) {
            $joinQueryBuilder->where('sc.type', '=', $modeFilter);
        }

        if ($branchId) {
            $joinQueryBuilder->where('l.branch_id', '=', $branchId);
        }

        $rawJoinRows = $joinQueryBuilder
            ->groupByRaw("{$monthExpr}, pm.name, sc.type")
            ->orderByRaw("{$monthExpr}")
            ->get();

        $allPackages = $rawJoinRows->pluck('package_name')->unique()->sort()->values()->toArray();

        $pivotMap = [];
        foreach ($rawJoinRows as $row) {
            $m = (int) $row->month_num;
            $p = $row->package_name;
            $mode = $row->delivery_mode;
            if (!isset($pivotMap[$m])) {
                $pivotMap[$m] = [];
            }
            if (!isset($pivotMap[$m][$p])) {
                $pivotMap[$m][$p] = ['online' => 0, 'offline' => 0];
            }
            $pivotMap[$m][$p][$mode] = (int) $row->student_count;
        }

        $monthLabels = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $pivotMonths = [];
        foreach ($monthLabels as $num => $label) {
            $packages = [];
            foreach ($allPackages as $pkg) {
                $packages[$pkg] = $pivotMap[$num][$pkg] ?? ['online' => 0, 'offline' => 0];
            }
            $pivotMonths[] = [
                'month'    => $num,
                'label'    => $label,
                'packages' => $packages,
            ];
        }

        $totals = [];
        foreach ($allPackages as $pkg) {
            $totals[$pkg] = ['online' => 0, 'offline' => 0];
        }
        foreach ($rawJoinRows as $row) {
            $p = $row->package_name;
            $mode = $row->delivery_mode;
            $totals[$p][$mode] = ($totals[$p][$mode] ?? 0) + (int) $row->student_count;
        }

        // Siswa Out
        $monthExprStopped = $isSqlite
            ? "CAST(strftime('%m', s.stopped_at) AS INTEGER)"
            : "MONTH(s.stopped_at)";

        $yearExprStopped = $isSqlite
            ? "CAST(strftime('%Y', s.stopped_at) AS INTEGER)"
            : "YEAR(s.stopped_at)";

        $stoppedQueryBuilder = DB::table('students as s')
            ->leftJoin('lead_enrollments as le', 's.id', '=', 'le.student_id')
            ->leftJoin('study_classes as sc', 'le.study_class_id', '=', 'sc.id')
            ->leftJoin('leads as l', 's.lead_id', '=', 'l.id')
            ->selectRaw("
                {$monthExprStopped} AS month_num,
                SUM(CASE WHEN sc.type = 'online' OR (sc.type IS NULL AND l.is_online = 1) THEN 1 ELSE 0 END) AS online_count,
                SUM(CASE WHEN sc.type = 'offline' OR (sc.type IS NULL AND (l.is_online = 0 OR l.is_online IS NULL)) THEN 1 ELSE 0 END) AS offline_count
            ")
            ->where('s.status', 'stop')
            ->whereNotNull('s.stopped_at')
            ->whereRaw("{$yearExprStopped} = ?", [$year]);

        if ($month) {
            $stoppedQueryBuilder->whereRaw("{$monthExprStopped} = ?", [$month]);
        }

        if ($branchId) {
            $stoppedQueryBuilder->where('l.branch_id', '=', $branchId);
        }

        $rawStoppedRows = $stoppedQueryBuilder
            ->groupByRaw("{$monthExprStopped}")
            ->get();

        $stoppedByMonth = [];
        $stoppedTotals = ['online' => 0, 'offline' => 0];

        foreach ($rawStoppedRows as $r) {
            $mNum = (int) $r->month_num;
            $on = (int) $r->online_count;
            $off = (int) $r->offline_count;
            $stoppedByMonth[$mNum] = ['online' => $on, 'offline' => $off];
            $stoppedTotals['online'] += $on;
            $stoppedTotals['offline'] += $off;
        }

        // Monthly student snapshots count
        $snapshotQuery = DB::table('branch_monthly_student_snapshots')
            ->selectRaw("month, SUM(total_students_count) as total_students")
            ->where('year', $year);

        if ($branchId) {
            $snapshotQuery->where('branch_id', '=', $branchId);
        }

        $monthlySnapshots = $snapshotQuery
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $currentYear = (int) now()->year;
        $currentMonth = (int) now()->month;

        $realtimeQuery = DB::table('lead_enrollments as le')
            ->leftJoin('leads as l', 'le.lead_id', '=', 'l.id')
            ->where('le.status', 'active');

        if ($branchId) {
            $realtimeQuery->where('l.branch_id', '=', $branchId);
        }

        $realtimeActiveEnrollmentsCount = $realtimeQuery->count();

        foreach ($pivotMonths as &$pmItem) {
            $mNum = $pmItem['month'];
            $pmItem['stopped'] = $stoppedByMonth[$mNum] ?? ['online' => 0, 'offline' => 0];

            $snap = $monthlySnapshots->get($mNum);
            if ($year === $currentYear && $mNum === $currentMonth) {
                $pmItem['total_students'] = $realtimeActiveEnrollmentsCount;
            } elseif ($snap && (int) $snap->total_students > 0) {
                $pmItem['total_students'] = (int) $snap->total_students;
            } else {
                $pmItem['total_students'] = 0;
            }
        }
        unset($pmItem);

        $joinPatterns = [
            'months'         => $pivotMonths,
            'package_list'   => $allPackages,
            'totals'         => $totals,
            'stopped_totals' => $stoppedTotals,
        ];

        // ═════════════════════════════════════════════════════════
        // 3. SISWA STOP
        // ═════════════════════════════════════════════════════════

        $stoppedAtFormat = $isSqlite
            ? "strftime('%Y-%m', stopped_at)"
            : "DATE_FORMAT(stopped_at, '%Y-%m')";

        $stoppedTrendQuery = Student::where('status', 'stop')
            ->whereNotNull('stopped_at')
            ->selectRaw("{$stoppedAtFormat} as month, count(*) as count")
            ->groupBy('month')
            ->orderBy('month', 'asc');
        $filterByDate($stoppedTrendQuery, 'stopped_at', $year);
        $stoppedMonthlyRaw = $stoppedTrendQuery->get();

        $stoppedMonthly = [];
        foreach ($stoppedMonthlyRaw as $row) {
            if (!$row->month) continue;
            try {
                $stoppedMonthly[] = [
                    'month'   => Carbon::createFromFormat('Y-m', $row->month)->format('M Y'),
                    'stopped' => (int) $row->count,
                ];
            } catch (\Exception $e) {
                $stoppedMonthly[] = [
                    'month'   => $row->month,
                    'stopped' => (int) $row->count,
                ];
            }
        }

        $totalStoppedQuery = Student::where('status', 'stop')->whereNotNull('stopped_at');
        $filterByDate($totalStoppedQuery, 'stopped_at', $year, $month);
        $totalStopped = $totalStoppedQuery->count();

        return [
            'filters' => [
                'year'               => $year,
                'month'              => $month,
                'mode'               => $modeFilter,
                'branch_id'          => $branchId,
                'tab'                => $activeTab,
                'available_years'    => $availableYears,
                'available_branches' => $availableBranches,
            ],
            'reports' => [
                'overall' => [
                    'total_active'       => $totalActiveStudents,
                    'online_count'       => $onlineCount,
                    'offline_count'      => $offlineCount,
                    'new_this_month'     => $newStudentsThisMonth,
                    'target_month'       => $targetMonth,
                    'monthly_trend'      => $monthlyTrend,
                    'branch_distribution' => $branchDistribution,
                    'grade_distribution'  => $overallGradeDistribution,
                ],
                'join_patterns' => $joinPatterns,
                'siswa_stop' => [
                    'total_stopped'  => $totalStopped,
                    'monthly_trend'  => $stoppedMonthly,
                ],
                'grades' => $overallGradeDistribution,
            ],
        ];
    }
}
