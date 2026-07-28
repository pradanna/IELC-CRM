<?php

namespace App\Http\Controllers\Admin\Academic;

use App\Http\Controllers\Controller;
use App\Domains\Academic\Domain\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $isSqlite = \DB::connection()->getDriverName() === 'sqlite';

        $year  = (int) $request->input('year', now()->year);
        $month = $request->input('month') ? (int) $request->input('month') : null;
        $activeTab = $request->input('tab', 'overall');

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

        // ── Overall tab: always use year-only (no month filter) ────────────────
        // The Overall tab UI does NOT show a month selector, so $month from URL
        // (possibly a stale param from another tab) must NOT affect these queries.

        // Total active students for the selected year
        $totalActiveQuery = Student::where('status', 'active');
        $filterByDate($totalActiveQuery, 'start_join', $year); // NO $month
        $totalActiveStudents = $totalActiveQuery->count();

        // New students in target month
        $targetMonth = $month ?? (int) now()->month;
        $newStudentsQuery = Student::where('status', 'active');
        $filterByDate($newStudentsQuery, 'created_at', $year, $targetMonth);
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

        // Online vs Offline breakdown – year-only (no month)
        $channelCounts = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->selectRaw('sum(case when leads.is_online = 1 then 1 else 0 end) as online_count, sum(case when leads.is_online = 0 then 1 else 0 end) as offline_count');
        $filterByDate($channelCounts, 'students.start_join', $year); // NO $month
        $channelData = $channelCounts->first();

        $onlineCount = (int) ($channelData->online_count ?? 0);
        $offlineCount = (int) ($channelData->offline_count ?? 0);

        // Grade distribution – year-only (no month)
        $gradeQuery = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->selectRaw("COALESCE(leads.grade, 'UMUM') as raw_grade, leads.school_level as school_level, count(*) as count")
            ->groupBy('raw_grade', 'school_level');
        $filterByDate($gradeQuery, 'students.start_join', $year); // NO $month
        $gradeDistributionRaw = $gradeQuery->get();

        $categoriesMap = [
            'PG' => 'PG', 'TK' => 'TK', 'SD' => 'SD',
            'SMP' => 'SMP', 'SMA' => 'SMA', 'KULIAH' => 'KULIAH', 'UMUM' => 'UMUM',
        ];

        $overallGradeDistribution = [];
        foreach ($categoriesMap as $dbValue => $label) {
            $sum = 0;
            foreach ($gradeDistributionRaw as $item) {
                $g = strtoupper(trim($item->raw_grade));
                if ($g === $dbValue || str_starts_with($g, $dbValue)) {
                    $sum += (int) $item->count;
                }
            }
            $overallGradeDistribution[] = [
                'name'  => $label,
                'count' => $sum,
            ];
        }

        // Branch distribution – year-only (no month)
        $branchQuery = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->join('branches', 'leads.branch_id', '=', 'branches.id')
            ->selectRaw('branches.name as branch_name, count(*) as count')
            ->groupBy('branches.name');
        $filterByDate($branchQuery, 'students.start_join', $year); // NO $month
        $branchDistribution = $branchQuery->get()->map(fn($item) => [
            'name'  => $item->branch_name,
            'value' => (int) $item->count,
        ]);

        // ═════════════════════════════════════════════════════════
        // 2. POLA JOIN
        // ═════════════════════════════════════════════════════════

        $joinQuery = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->leftJoin('lead_types', 'leads.lead_type_id', '=', 'lead_types.id')
            ->selectRaw("
                COALESCE(lead_types.name, 'Lainnya') as program_name,
                sum(case when leads.is_online = 1 then 1 else 0 end) as online_count,
                sum(case when leads.is_online = 0 then 1 else 0 end) as offline_count,
                count(*) as total_count
            ")
            ->groupBy('program_name');
        $filterByDate($joinQuery, 'students.start_join', $year, $month);
        $joinPatterns = $joinQuery->get()->map(fn($item) => [
            'program' => $item->program_name,
            'online'  => (int) $item->online_count,
            'offline' => (int) $item->offline_count,
            'total'   => (int) $item->total_count,
        ]);

        // ═════════════════════════════════════════════════════════
        // 3. SISWA STOP
        // ═════════════════════════════════════════════════════════

        $stoppedAtFormat = $isSqlite
            ? "strftime('%Y-%m', stopped_at)"
            : "DATE_FORMAT(stopped_at, '%Y-%m')";

        // Trend chart (full year – ignores month filter)
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

        // Total stopped (respects month filter for the stat card)
        $totalStoppedQuery = Student::where('status', 'stop')->whereNotNull('stopped_at');
        $filterByDate($totalStoppedQuery, 'stopped_at', $year, $month);
        $totalStopped = $totalStoppedQuery->count();

        // ═════════════════════════════════════════════════════════
        // 4. TINGKAT PENDIDIKAN
        // ═════════════════════════════════════════════════════════

        $gradeQuery = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->selectRaw("COALESCE(leads.grade, 'UMUM') as grade, count(*) as count")
            ->groupBy('grade');
        $filterByDate($gradeQuery, 'students.start_join', $year, $month);
        $gradeDistributionRaw = $gradeQuery->get();

        $categoriesMap = [
            'PG' => 'PG', 'TK' => 'TK', 'SD' => 'SD',
            'SMP' => 'SMP', 'SMA' => 'SMA', 'KULIAH' => 'KULIAH', 'UMUM' => 'UMUM',
        ];

        $gradeDistribution = [];
        foreach ($categoriesMap as $dbValue => $label) {
            $matchingRow = $gradeDistributionRaw->first(fn($item) => strtoupper($item->grade) === $dbValue);
            $gradeDistribution[] = [
                'name'  => $label,
                'count' => $matchingRow ? (int) $matchingRow->count : 0,
            ];
        }

        // ═════════════════════════════════════════════════════════
        // RESPONSE
        // ═════════════════════════════════════════════════════════

        return Inertia::render('Admin/Academic/Dashboard', [
            'filters' => [
                'year'            => $year,
                'month'           => $month,
                'tab'             => $activeTab,
                'available_years' => $availableYears,
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
                'grades' => $gradeDistribution,
            ],
        ]);
    }
}
