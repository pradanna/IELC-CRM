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

        // Total active students (filtered by branch and mode if selected)
        $totalActiveStudentsQuery = Student::where('students.status', 'active');
        if ($branchId) {
            $totalActiveStudentsQuery->whereHas('lead', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        if ($modeFilter === 'online') {
            $totalActiveStudentsQuery->where(function($q) {
                $q->whereHas('studyClasses', fn($sc) => $sc->where('type', 'online'))
                  ->orWhereHas('lead', fn($l) => $l->where('is_online', 1));
            });
        } elseif ($modeFilter === 'offline') {
            $totalActiveStudentsQuery->where(function($q) {
                $q->whereHas('studyClasses', fn($sc) => $sc->where('type', '!=', 'online'))
                  ->orWhereHas('lead', fn($l) => $l->where('is_online', 0)->orWhereNull('is_online'));
            });
        }
        $totalActiveStudents = $totalActiveStudentsQuery->count();

        // New students joined in target month/year
        $targetMonth = $month ?? (int) now()->month;
        $newStudentsQuery = Student::where('students.status', 'active');
        if ($branchId) {
            $newStudentsQuery->whereHas('lead', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        if ($modeFilter === 'online') {
            $newStudentsQuery->where(function($q) {
                $q->whereHas('studyClasses', fn($sc) => $sc->where('type', 'online'))
                  ->orWhereHas('lead', fn($l) => $l->where('is_online', 1));
            });
        } elseif ($modeFilter === 'offline') {
            $newStudentsQuery->where(function($q) {
                $q->whereHas('studyClasses', fn($sc) => $sc->where('type', '!=', 'online'))
                  ->orWhereHas('lead', fn($l) => $l->where('is_online', 0)->orWhereNull('is_online'));
            });
        }
        $filterByDate($newStudentsQuery, 'start_join', $year, $targetMonth);
        $newStudentsThisMonth = $newStudentsQuery->count();

        // Monthly trend (full year – filtered by branch and mode if selected)
        $dateFormat = $isSqlite
            ? "strftime('%Y-%m', students.start_join)"
            : "DATE_FORMAT(students.start_join, '%Y-%m')";

        $monthlyTrendStudentsQuery = Student::where('students.status', 'active')
            ->whereNotNull('students.start_join')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->leftJoin('branches', 'leads.branch_id', '=', 'branches.id')
            ->select([
                'students.id',
                'students.student_number',
                'students.start_join',
                'students.loyalty_tier',
                'students.rejoin_count',
                'leads.name as student_name',
                'leads.phone',
                'leads.school',
                'leads.grade',
                'branches.name as branch_name',
                DB::raw("{$dateFormat} as month_key")
            ])
            ->orderBy('students.start_join', 'asc');

        if ($branchId) {
            $monthlyTrendStudentsQuery->where('leads.branch_id', $branchId);
        }

        if ($modeFilter === 'online') {
            $monthlyTrendStudentsQuery->where(function($q) {
                $q->whereExists(function($sub) {
                    $sub->select(DB::raw(1))
                        ->from('lead_enrollments')
                        ->join('study_classes', 'lead_enrollments.study_class_id', '=', 'study_classes.id')
                        ->whereColumn('lead_enrollments.student_id', 'students.id')
                        ->where('study_classes.type', 'online');
                })->orWhere('leads.is_online', 1);
            });
        } elseif ($modeFilter === 'offline') {
            $monthlyTrendStudentsQuery->where(function($q) {
                $q->whereExists(function($sub) {
                    $sub->select(DB::raw(1))
                        ->from('lead_enrollments')
                        ->join('study_classes', 'lead_enrollments.study_class_id', '=', 'study_classes.id')
                        ->whereColumn('lead_enrollments.student_id', 'students.id')
                        ->where('study_classes.type', '!=', 'online');
                })->orWhere(function($sub2) {
                    $sub2->where('leads.is_online', 0)->orWhereNull('leads.is_online');
                });
            });
        }

        $filterByDate($monthlyTrendStudentsQuery, 'students.start_join', $year);
        $allStudentsByMonth = $monthlyTrendStudentsQuery->get()->groupBy('month_key');

        $monthlyTrend = [];
        foreach ($allStudentsByMonth as $monthKey => $studentsList) {
            if (!$monthKey) continue;
            try {
                $formattedMonth = Carbon::createFromFormat('Y-m', $monthKey)->format('M Y');
            } catch (\Exception $e) {
                $formattedMonth = $monthKey;
            }

            $monthlyTrend[] = [
                'month'        => $formattedMonth,
                'raw_month'    => $monthKey,
                'students'     => $studentsList->count(),
                'student_list' => $studentsList->map(fn($s) => [
                    'id'             => $s->id,
                    'student_number' => $s->student_number,
                    'name'           => $s->student_name,
                    'phone'          => $s->phone,
                    'school'         => $s->school,
                    'grade'          => $s->grade,
                    'branch'         => $s->branch_name,
                    'start_join'     => $s->start_join ? Carbon::parse($s->start_join)->format('d M Y') : '-',
                    'loyalty_tier'   => $s->loyalty_tier,
                    'rejoin_count'   => $s->rejoin_count,
                ])->values()->all(),
            ];
        }

        // Online vs Offline breakdown
        $channelCounts = Student::where('students.status', 'active')
            ->leftJoin('lead_enrollments', function ($join) {
                $join->on('students.id', '=', 'lead_enrollments.student_id')
                     ->where('lead_enrollments.status', '=', 'active');
            })
            ->leftJoin('study_classes', 'lead_enrollments.study_class_id', '=', 'study_classes.id')
            ->leftJoin('leads', 'students.lead_id', '=', 'leads.id');

        if ($branchId) {
            $channelCounts->where('leads.branch_id', $branchId);
        }

        $channelCounts->selectRaw("
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

        $gradeStudentsQuery = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->leftJoin('branches', 'leads.branch_id', '=', 'branches.id')
            ->select([
                'students.id',
                'students.student_number',
                'students.start_join',
                'students.loyalty_tier',
                'students.rejoin_count',
                'students.profile_picture',
                'leads.name as student_name',
                'leads.phone',
                'leads.school',
                'leads.grade as raw_grade',
                'branches.name as branch_name',
            ]);

        if ($branchId) {
            $gradeStudentsQuery->where('leads.branch_id', $branchId);
        }

        if ($modeFilter === 'online') {
            $gradeStudentsQuery->where(function($q) {
                $q->whereExists(function($sub) {
                    $sub->select(DB::raw(1))
                        ->from('lead_enrollments')
                        ->join('study_classes', 'lead_enrollments.study_class_id', '=', 'study_classes.id')
                        ->whereColumn('lead_enrollments.student_id', 'students.id')
                        ->where('study_classes.type', 'online');
                })->orWhere('leads.is_online', 1);
            });
        } elseif ($modeFilter === 'offline') {
            $gradeStudentsQuery->where(function($q) {
                $q->whereExists(function($sub) {
                    $sub->select(DB::raw(1))
                        ->from('lead_enrollments')
                        ->join('study_classes', 'lead_enrollments.study_class_id', '=', 'study_classes.id')
                        ->whereColumn('lead_enrollments.student_id', 'students.id')
                        ->where('study_classes.type', '!=', 'online');
                })->orWhere(function($sub2) {
                    $sub2->where('leads.is_online', 0)->orWhereNull('leads.is_online');
                });
            });
        }

        if ($month) {
            $filterByDate($gradeStudentsQuery, 'students.start_join', $year, $month);
        }

        $allGradeStudents = $gradeStudentsQuery->get();

        $gradeGroups = [
            'PG' => [], 'TK' => [], 'SD' => [], 'SMP' => [], 'SMA' => [], 'UMUM' => []
        ];

        foreach ($allGradeStudents as $item) {
            $rawGrade = strtoupper(trim($item->raw_grade ?? ''));
            $studentDto = [
                'id'              => $item->id,
                'student_number'  => $item->student_number,
                'name'            => $item->student_name,
                'phone'           => $item->phone,
                'school'          => $item->school,
                'grade'           => $item->raw_grade,
                'branch'          => $item->branch_name,
                'start_join'      => $item->start_join ? Carbon::parse($item->start_join)->format('d M Y') : '-',
                'loyalty_tier'    => $item->loyalty_tier,
                'rejoin_count'    => $item->rejoin_count,
                'profile_picture' => $item->profile_picture ? asset('storage/' . $item->profile_picture) : null,
            ];

            if (str_contains($rawGrade, 'PG') || str_contains($rawGrade, 'PLAYGROUP') || str_contains($rawGrade, 'KB')) {
                $gradeGroups['PG'][] = $studentDto;
            } elseif (str_contains($rawGrade, 'TK')) {
                $gradeGroups['TK'][] = $studentDto;
            } elseif (str_contains($rawGrade, 'SD')) {
                $gradeGroups['SD'][] = $studentDto;
            } elseif (str_contains($rawGrade, 'SMP')) {
                $gradeGroups['SMP'][] = $studentDto;
            } elseif (str_contains($rawGrade, 'SMA') || str_contains($rawGrade, 'SMK') || str_contains($rawGrade, 'SLTA')) {
                $gradeGroups['SMA'][] = $studentDto;
            } else {
                $gradeGroups['UMUM'][] = $studentDto;
            }
        }

        $overallGradeDistribution = [];
        foreach ($gradeGroups as $label => $list) {
            $overallGradeDistribution[] = [
                'name'         => $label,
                'count'        => count($list),
                'student_list' => $list,
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

        // Fetch Detailed Join Rows for Interactive Click Drilldown
        $detailJoinQuery = DB::table('lead_enrollments as le')
            ->join('study_classes as sc', 'le.study_class_id', '=', 'sc.id')
            ->join('price_masters as pm', 'sc.price_master_id', '=', 'pm.id')
            ->join('students as s', 'le.student_id', '=', 's.id')
            ->leftJoin('leads as l', 'le.lead_id', '=', 'l.id')
            ->leftJoin('branches as b', 'l.branch_id', '=', 'b.id')
            ->selectRaw("
                {$monthExpr} AS month_num,
                pm.name      AS package_name,
                sc.type      AS delivery_mode,
                s.id         AS student_id,
                s.student_number AS student_number,
                s.profile_picture AS profile_picture,
                l.name       AS student_name,
                l.phone      AS student_phone,
                l.grade      AS student_grade,
                l.school     AS student_school,
                b.name       AS branch_name,
                sc.name      AS class_name,
                le.joined_at AS joined_at
            ")
            ->whereRaw("{$yearExprLE} = ?", [$year]);

        if ($month) {
            $detailJoinQuery->whereRaw("{$monthExpr} = ?", [$month]);
        }
        if ($modeFilter && in_array($modeFilter, ['online', 'offline'])) {
            $detailJoinQuery->where('sc.type', '=', $modeFilter);
        }
        if ($branchId) {
            $detailJoinQuery->where('l.branch_id', '=', $branchId);
        }

        $allDetailJoinRows = $detailJoinQuery->get();

        $studentsByMonthPkgMode = [];
        foreach ($allDetailJoinRows as $r) {
            $m = (int) $r->month_num;
            $p = $r->package_name;
            $mode = $r->delivery_mode;
            $studentsByMonthPkgMode[$m][$p][$mode][] = [
                'id'              => $r->student_id,
                'student_number'  => $r->student_number,
                'name'            => $r->student_name,
                'phone'           => $r->student_phone,
                'grade'           => $r->student_grade,
                'school'          => $r->student_school,
                'branch_name'     => $r->branch_name,
                'class_name'      => $r->class_name,
                'joined_at'       => $r->joined_at,
                'profile_picture' => $r->profile_picture ? asset('storage/' . $r->profile_picture) : null,
            ];
        }

        // Siswa Out Expressions
        $monthExprStopped = $isSqlite
            ? "CAST(strftime('%m', s.stopped_at) AS INTEGER)"
            : "MONTH(s.stopped_at)";

        $yearExprStopped = $isSqlite
            ? "CAST(strftime('%Y', s.stopped_at) AS INTEGER)"
            : "YEAR(s.stopped_at)";

        // Siswa Out Details
        $detailStoppedQuery = DB::table('students as s')
            ->leftJoin('lead_enrollments as le', 's.id', '=', 'le.student_id')
            ->leftJoin('study_classes as sc', 'le.study_class_id', '=', 'sc.id')
            ->leftJoin('leads as l', 's.lead_id', '=', 'l.id')
            ->leftJoin('branches as b', 'l.branch_id', '=', 'b.id')
            ->selectRaw("
                {$monthExprStopped} AS month_num,
                CASE WHEN sc.type = 'online' OR (sc.type IS NULL AND l.is_online = 1) THEN 'online' ELSE 'offline' END AS delivery_mode,
                s.id             AS student_id,
                s.student_number AS student_number,
                s.profile_picture AS profile_picture,
                l.name           AS student_name,
                l.phone          AS student_phone,
                l.grade          AS student_grade,
                l.school         AS student_school,
                b.name           AS branch_name,
                sc.name          AS class_name,
                s.notes          AS student_notes,
                s.stopped_at     AS stopped_at
            ")
            ->where('s.status', 'stop')
            ->whereNotNull('s.stopped_at')
            ->whereRaw("{$yearExprStopped} = ?", [$year]);

        if ($month) {
            $detailStoppedQuery->whereRaw("{$monthExprStopped} = ?", [$month]);
        }
        if ($branchId) {
            $detailStoppedQuery->where('l.branch_id', '=', $branchId);
        }

        $indonesianMonths = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $formatIndoDate = function ($dateStr) use ($indonesianMonths) {
            if (empty($dateStr)) return '-';
            try {
                $c = Carbon::parse($dateStr);
                $d = $c->format('d');
                $m = $indonesianMonths[(int) $c->format('m')] ?? $c->format('F');
                $y = $c->format('Y');
                return "{$d} {$m} {$y}";
            } catch (\Exception $e) {
                return $dateStr;
            }
        };

        $allDetailStoppedRows = $detailStoppedQuery->get();
        $stoppedStudentsByMonth = [];
        foreach ($allDetailStoppedRows as $r) {
            $m = (int) $r->month_num;
            $mode = $r->delivery_mode;
            $cleanNotes = $r->student_notes ? trim($r->student_notes) : null;
            if ($cleanNotes && str_starts_with(strtoupper($cleanNotes), 'NIK:')) {
                $cleanNotes = null;
            }
            $stoppedStudentsByMonth[$m][$mode][] = [
                'id'              => $r->student_id,
                'student_number'  => $r->student_number,
                'name'            => $r->student_name,
                'phone'           => $r->student_phone,
                'grade'           => $r->student_grade,
                'school'          => $r->student_school,
                'branch_name'     => $r->branch_name,
                'class_name'      => $r->class_name,
                'stopped_at'      => $formatIndoDate($r->stopped_at),
                'notes'           => $cleanNotes,
                'profile_picture' => $r->profile_picture ? asset('storage/' . $r->profile_picture) : null,
            ];
        }

        $monthLabels = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $pivotMonths = [];
        foreach ($monthLabels as $num => $label) {
            $packages = [];
            $packageStudents = [];
            foreach ($allPackages as $pkg) {
                $packages[$pkg] = $pivotMap[$num][$pkg] ?? ['online' => 0, 'offline' => 0];
                $packageStudents[$pkg] = [
                    'online'  => $studentsByMonthPkgMode[$num][$pkg]['online'] ?? [],
                    'offline' => $studentsByMonthPkgMode[$num][$pkg]['offline'] ?? [],
                ];
            }
            $pivotMonths[] = [
                'month'            => $num,
                'label'            => $label,
                'packages'         => $packages,
                'package_students' => $packageStudents,
                'stopped_students' => [
                    'online'  => $stoppedStudentsByMonth[$num]['online'] ?? [],
                    'offline' => $stoppedStudentsByMonth[$num]['offline'] ?? [],
                ],
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
            ? "strftime('%Y-%m', s.stopped_at)"
            : "DATE_FORMAT(s.stopped_at, '%Y-%m')";

        $stoppedTrendStudentsQuery = DB::table('students as s')
            ->leftJoin('lead_enrollments as le', 's.id', '=', 'le.student_id')
            ->leftJoin('study_classes as sc', 'le.study_class_id', '=', 'sc.id')
            ->leftJoin('leads as l', 's.lead_id', '=', 'l.id')
            ->leftJoin('branches as b', 'l.branch_id', '=', 'b.id')
            ->selectRaw("
                s.id             AS student_id,
                s.student_number AS student_number,
                s.profile_picture AS profile_picture,
                l.name           AS student_name,
                l.phone          AS student_phone,
                l.grade          AS student_grade,
                l.school         AS student_school,
                b.name           AS branch_name,
                sc.name          AS class_name,
                s.start_join,
                s.notes          AS notes,
                s.stopped_at     AS stopped_at,
                CASE WHEN sc.type = 'online' OR (sc.type IS NULL AND l.is_online = 1) THEN 'online' ELSE 'offline' END AS delivery_mode,
                {$stoppedAtFormat} AS month_key
            ")
            ->where('s.status', 'stop')
            ->whereNotNull('s.stopped_at');

        $filterByDate($stoppedTrendStudentsQuery, 's.stopped_at', $year);
        if ($branchId) {
            $stoppedTrendStudentsQuery->where('l.branch_id', '=', $branchId);
        }
        if ($modeFilter && in_array($modeFilter, ['online', 'offline'])) {
            $stoppedTrendStudentsQuery->where(function($q) use ($modeFilter) {
                if ($modeFilter === 'online') {
                    $q->where('sc.type', 'online')->orWhere(function($sub) {
                        $sub->whereNull('sc.type')->where('l.is_online', 1);
                    });
                } else {
                    $q->where('sc.type', 'offline')->orWhere(function($sub) {
                        $sub->whereNull('sc.type')->where(function($sub2) {
                            $sub2->where('l.is_online', 0)->orWhereNull('l.is_online');
                        });
                    });
                }
            });
        }

        $allStoppedStudentsYear = $stoppedTrendStudentsQuery->orderBy('s.stopped_at', 'asc')->get();
        $stoppedStudentsByMonthKey = $allStoppedStudentsYear->groupBy('month_key');

        $stoppedMonthly = [];
        foreach ($stoppedStudentsByMonthKey as $monthKey => $studentsList) {
            if (!$monthKey) continue;
            try {
                $formattedMonth = Carbon::createFromFormat('Y-m', $monthKey)->format('M Y');
            } catch (\Exception $e) {
                $formattedMonth = $monthKey;
            }

            $mappedStudents = $studentsList->map(function($r) use ($formatIndoDate) {
                $cleanNotes = $r->notes ? trim($r->notes) : null;
                if ($cleanNotes && str_starts_with(strtoupper($cleanNotes), 'NIK:')) {
                    $cleanNotes = null;
                }
                return [
                    'id'              => $r->student_id,
                    'student_number'  => $r->student_number,
                    'name'            => $r->student_name,
                    'phone'           => $r->student_phone,
                    'grade'           => $r->student_grade,
                    'school'          => $r->student_school,
                    'branch'          => $r->branch_name,
                    'branch_name'     => $r->branch_name,
                    'class_name'      => $r->class_name,
                    'start_join'      => $formatIndoDate($r->start_join),
                    'stopped_at'      => $formatIndoDate($r->stopped_at),
                    'delivery_mode'   => $r->delivery_mode,
                    'notes'           => $cleanNotes,
                    'profile_picture' => $r->profile_picture ? asset('storage/' . $r->profile_picture) : null,
                ];
            })->values()->all();

            $stoppedMonthly[] = [
                'month'        => $formattedMonth,
                'raw_month'    => $monthKey,
                'stopped'      => count($mappedStudents),
                'name'         => "Siswa Stop Periode {$formattedMonth}",
                'count'        => count($mappedStudents),
                'is_stopped'   => true,
                'student_list' => $mappedStudents,
            ];
        }

        $totalStoppedQuery = Student::where('status', 'stop')->whereNotNull('stopped_at');
        $filterByDate($totalStoppedQuery, 'stopped_at', $year, $month);
        $totalStopped = $totalStoppedQuery->count();

        $stoppedStudentsListQuery = DB::table('students as s')
            ->leftJoin('lead_enrollments as le', 's.id', '=', 'le.student_id')
            ->leftJoin('study_classes as sc', 'le.study_class_id', '=', 'sc.id')
            ->leftJoin('leads as l', 's.lead_id', '=', 'l.id')
            ->leftJoin('branches as b', 'l.branch_id', '=', 'b.id')
            ->selectRaw("
                s.id             AS student_id,
                s.student_number AS student_number,
                s.profile_picture AS profile_picture,
                l.name           AS student_name,
                l.phone          AS student_phone,
                l.grade          AS student_grade,
                l.school         AS student_school,
                b.name           AS branch_name,
                sc.name          AS class_name,
                s.start_join,
                s.notes          AS notes,
                s.stopped_at     AS stopped_at,
                CASE WHEN sc.type = 'online' OR (sc.type IS NULL AND l.is_online = 1) THEN 'online' ELSE 'offline' END AS delivery_mode
            ")
            ->where('s.status', 'stop')
            ->whereNotNull('s.stopped_at');

        $filterByDate($stoppedStudentsListQuery, 's.stopped_at', $year, $month);
        if ($branchId) {
            $stoppedStudentsListQuery->where('l.branch_id', '=', $branchId);
        }
        if ($modeFilter && in_array($modeFilter, ['online', 'offline'])) {
            $stoppedStudentsListQuery->where(function($q) use ($modeFilter) {
                if ($modeFilter === 'online') {
                    $q->where('sc.type', 'online')->orWhere(function($sub) {
                        $sub->whereNull('sc.type')->where('l.is_online', 1);
                    });
                } else {
                    $q->where('sc.type', 'offline')->orWhere(function($sub) {
                        $sub->whereNull('sc.type')->where(function($sub2) {
                            $sub2->where('l.is_online', 0)->orWhereNull('l.is_online');
                        });
                    });
                }
            });
        }

        $stoppedStudentsList = $stoppedStudentsListQuery
            ->orderBy('s.stopped_at', 'desc')
            ->get()
            ->map(function($r) use ($formatIndoDate) {
                $cleanNotes = $r->notes ? trim($r->notes) : null;
                if ($cleanNotes && str_starts_with(strtoupper($cleanNotes), 'NIK:')) {
                    $cleanNotes = null;
                }
                return [
                    'id'              => $r->student_id,
                    'student_number'  => $r->student_number,
                    'name'            => $r->student_name,
                    'phone'           => $r->student_phone,
                    'grade'           => $r->student_grade,
                    'school'          => $r->student_school,
                    'branch_name'     => $r->branch_name,
                    'class_name'      => $r->class_name,
                    'start_join'      => $formatIndoDate($r->start_join),
                    'stopped_at'      => $formatIndoDate($r->stopped_at),
                    'delivery_mode'   => $r->delivery_mode,
                    'notes'           => $cleanNotes,
                    'profile_picture' => $r->profile_picture ? asset('storage/' . $r->profile_picture) : null,
                ];
            });

        // ═════════════════════════════════════════════════════════
        // 5. CLASS TRANSFERS (Riwayat Pindah Kelas)
        // ═════════════════════════════════════════════════════════
        $transfersQuery = DB::table('activity_log')
            ->join('students', 'activity_log.subject_id', '=', 'students.id')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->leftJoin('branches', 'leads.branch_id', '=', 'branches.id')
            ->leftJoin('users', 'activity_log.causer_id', '=', 'users.id')
            ->leftJoin('superadmins', 'users.id', '=', 'superadmins.user_id')
            ->leftJoin('frontdesks', 'users.id', '=', 'frontdesks.user_id')
            ->leftJoin('marketing', 'users.id', '=', 'marketing.user_id')
            ->leftJoin('finance', 'users.id', '=', 'finance.user_id')
            ->leftJoin('teachers', 'users.id', '=', 'teachers.user_id')
            ->where(function ($q) {
                $q->where('activity_log.description', 'like', '%dipindahkan dari kelas%')
                  ->orWhere('activity_log.properties', 'like', '%from_class_name%');
            })
            ->select([
                'activity_log.id',
                'activity_log.created_at',
                'activity_log.properties',
                'activity_log.description',
                DB::raw('COALESCE(superadmins.name, frontdesks.name, marketing.name, finance.name, teachers.name, users.email, "Admin") as causer_name'),
                'students.id as student_id',
                'students.student_number',
                'students.profile_picture',
                'leads.name as student_name',
                'leads.phone as student_phone',
                'leads.school as student_school',
                'leads.grade as student_grade',
                'branches.name as branch_name',
                'leads.branch_id',
            ]);

        if ($branchId) {
            $transfersQuery->where('leads.branch_id', $branchId);
        }

        if ($year) {
            if ($isSqlite) {
                $transfersQuery->whereRaw("cast(strftime('%Y', activity_log.created_at) as integer) = ?", [$year]);
            } else {
                $transfersQuery->whereYear('activity_log.created_at', $year);
            }
        }

        if ($month) {
            if ($isSqlite) {
                $transfersQuery->whereRaw("cast(strftime('%m', activity_log.created_at) as integer) = ?", [$month]);
            } else {
                $transfersQuery->whereMonth('activity_log.created_at', $month);
            }
        }

        $rawTransfers = $transfersQuery->orderBy('activity_log.created_at', 'desc')->get();

        $transfersList = $rawTransfers->map(function ($row) use ($formatIndoDate) {
            $props = json_decode($row->properties ?? '{}', true) ?: [];
            
            $fromClassName = $props['from_class_name'] ?? '-';
            $toClassName = $props['to_class_name'] ?? '-';
            $reason = $props['reason'] ?? null;
            $effectiveDate = $props['effective_date'] ?? null;

            // Fallback parsing from description if properties empty
            if ($fromClassName === '-' && preg_match("/dipindahkan dari kelas '([^']+)' ke '([^']+)'/i", $row->description, $m)) {
                $fromClassName = $m[1] ?? '-';
                $toClassName = $m[2] ?? '-';
            }

            return [
                'id'              => $row->id,
                'student_id'      => $row->student_id,
                'student_number'  => $row->student_number,
                'name'            => $row->student_name,
                'phone'           => $row->student_phone,
                'school'          => $row->student_school,
                'grade'           => $row->student_grade,
                'branch_name'     => $row->branch_name ?? 'Central',
                'from_class_name' => $fromClassName,
                'to_class_name'   => $toClassName,
                'effective_date'  => $effectiveDate ? $formatIndoDate($effectiveDate) : $formatIndoDate($row->created_at),
                'created_at'      => Carbon::parse($row->created_at)->format('d M Y H:i'),
                'causer_name'     => $row->causer_name ?? 'Admin',
                'reason'          => $reason ?: '-',
                'profile_picture' => $row->profile_picture ? asset('storage/' . $row->profile_picture) : null,
            ];
        });

        // Monthly trend for transfers
        $transferTrend = [];
        $groupedByMonth = $rawTransfers->groupBy(function ($item) {
            return Carbon::parse($item->created_at)->format('Y-m');
        });

        foreach ($groupedByMonth as $mKey => $items) {
            $transferTrend[] = [
                'month'     => Carbon::createFromFormat('Y-m', $mKey)->format('M Y'),
                'raw_month' => $mKey,
                'total'     => $items->count(),
            ];
        }

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
                    'students'       => $stoppedStudentsList,
                ],
                'class_transfers' => [
                    'total_transfers' => $transfersList->count(),
                    'monthly_trend'   => $transferTrend,
                    'transfers'       => $transfersList->values()->all(),
                ],
                'grades' => $overallGradeDistribution,
            ],
        ];
    }
}
