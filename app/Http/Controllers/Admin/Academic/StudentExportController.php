<?php

namespace App\Http\Controllers\Admin\Academic;

use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class StudentExportController extends Controller
{
    /**
     * Export as Excel (.xls or .csv).
     */
    public function exportExcel(Request $request): Response
    {
        $tab = $request->input('tab', 'list');

        [$headers, $rows, $filename] = $this->buildData($request, $tab);

        if ($tab === 'branch_matrix') {
            $content = $this->buildMatrixExcelHtml($rows);
            return response($content, 200, [
                'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}.xls\"",
            ]);
        }

        $csv = $this->buildCsv($headers, $rows);

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}.csv\"",
        ]);
    }

    /**
     * Export as print-ready HTML (user can Ctrl+P → Save as PDF).
     */
    public function exportPdf(Request $request)
    {
        $tab = $request->input('tab', 'list');

        [$headers, $rows, $filename, $title] = $this->buildData($request, $tab);

        $year  = $request->input('year', now()->year);
        $month = $request->input('month');

        if ($tab === 'branch_matrix') {
            return response()->view('pdf.branch-monthly-matrix', [
                'matrixData' => $rows,
                'year'       => $year,
                'filename'   => $filename,
            ]);
        }

        return response()->view('pdf.student-export', [
            'title'    => $title,
            'headers'  => $headers,
            'rows'     => $rows,
            'filename' => $filename,
            'year'     => $year,
            'month'    => $month,
            'tab'      => $tab,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Data builders
    // ─────────────────────────────────────────────────────────────────────────

    private function buildData(Request $request, string $tab): array
    {
        return match ($tab) {
            'overall'       => $this->buildOverall($request),
            'join_patterns' => $this->buildJoinPatterns($request),
            'siswa_stop'    => $this->buildSiswaStop($request),
            'grades'        => $this->buildGrades($request),
            'branch_matrix' => $this->buildBranchMatrix($request),
            default         => $this->buildStudentList($request),
        };
    }

    // ── List ─────────────────────────────────────────────────────────────────

    private function buildStudentList(Request $request): array
    {
        $query = Student::with(['lead.branch', 'studyClasses'])
            ->select('students.*');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->whereHas('lead', fn ($lq) =>
                    $lq->where('name', 'like', "%{$s}%")->orWhere('phone', 'like', "%{$s}%")
                )->orWhere('student_number', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('class_category')) {
            $cat = strtolower($request->class_category);
            $query->whereHas('studyClasses', fn ($q) => $q->where('category', $cat));
        }

        if ($request->filled('study_class_id')) {
            $query->whereHas('studyClasses', fn ($q) =>
                $q->where('study_classes.id', $request->study_class_id)
            );
        }

        if ($request->filled('expiry_status')) {
            $status = $request->expiry_status;
            if ($status === 'expired') {
                $query->whereHas('studyClasses', fn ($q) =>
                    $q->where('end_session_date', '<', now()->toDateString())
                );
            } elseif ($status === 'expiring_soon') {
                $query->whereHas('studyClasses', fn ($q) =>
                    $q->whereBetween('end_session_date', [now()->toDateString(), now()->addDays(21)->toDateString()])
                );
            } elseif ($status === 'not_expired') {
                $query->whereHas('studyClasses', fn ($q) =>
                    $q->where('end_session_date', '>', now()->addDays(21)->toDateString())
                );
            }
        }

        $students = $query->orderBy('created_at', 'desc')->get();

        $headers = ['No', 'Student Number', 'Nama', 'Phone', 'Branch', 'Status', 'Kelas Aktif', 'Tgl Join'];
        $rows = $students->map(function ($s, $i) {
            return [
                $i + 1,
                $s->student_number ?? '-',
                $s->lead?->name ?? '-',
                $s->lead?->phone ?? '-',
                $s->lead?->branch?->name ?? 'Central',
                $s->status ?? 'active',
                $s->studyClasses->pluck('name')->implode(', ') ?: '-',
                $s->start_join ? \Carbon\Carbon::parse($s->start_join)->format('d M Y') : '-',
            ];
        })->toArray();

        return [$headers, $rows, 'student-list-' . now()->format('Y-m-d'), 'Daftar Siswa'];
    }

    // ── Overall ──────────────────────────────────────────────────────────────

    private function buildOverall(Request $request): array
    {
        $year  = (int) $request->input('year', now()->year);
        $month = $request->input('month') ? (int) $request->input('month') : null;

        [$filterByDate] = $this->makeDateHelper();

        // Monthly trend
        $isSqlite   = \DB::connection()->getDriverName() === 'sqlite';
        $dateFormat = $isSqlite
            ? "strftime('%Y-%m', start_join)"
            : "DATE_FORMAT(start_join, '%Y-%m')";

        $trend = Student::where('status', 'active')
            ->whereNotNull('start_join')
            ->selectRaw("{$dateFormat} as month, count(*) as count")
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->whereRaw($isSqlite
                ? "cast(strftime('%Y', start_join) as integer) = ?"
                : "YEAR(start_join) = ?", [$year])
            ->get()
            ->map(fn ($r) => [$r->month ?? '-', (int) $r->count])
            ->toArray();

        // Branch distribution
        $branches = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->join('branches', 'leads.branch_id', '=', 'branches.id')
            ->selectRaw('branches.name as branch_name, count(*) as count')
            ->groupBy('branches.name')
            ->get()
            ->map(fn ($r) => [$r->branch_name, (int) $r->count])
            ->toArray();

        $headers = ['Bulan', 'Jumlah Siswa Aktif'];
        $rows    = $trend;

        // Append branch section
        $rows[] = [];
        $rows[] = ['=== DISTRIBUSI CABANG ===', ''];
        $rows[] = ['Cabang', 'Jumlah Siswa'];
        foreach ($branches as $b) {
            $rows[] = $b;
        }

        return [
            $headers,
            $rows,
            "overall-{$year}" . ($month ? "-bulan{$month}" : ''),
            "Overall Overview {$year}",
        ];
    }

    // ── Join Patterns ────────────────────────────────────────────────────────

    private function buildJoinPatterns(Request $request): array
    {
        $year  = (int) $request->input('year', now()->year);
        $month = $request->input('month') ? (int) $request->input('month') : null;

        $isSqlite = \DB::connection()->getDriverName() === 'sqlite';

        $query = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->leftJoin('lead_types', 'leads.lead_type_id', '=', 'lead_types.id')
            ->selectRaw("
                COALESCE(lead_types.name, 'Lainnya') as program_name,
                sum(case when leads.is_online = 1 then 1 else 0 end) as online_count,
                sum(case when leads.is_online = 0 then 1 else 0 end) as offline_count,
                count(*) as total_count
            ")
            ->groupBy('program_name');

        $this->applyDateFilter($query, 'students.start_join', $year, $month, $isSqlite);

        $data = $query->get();

        $headers = ['Tipe Program', 'Offline', 'Online', 'Total', 'Rasio Offline %', 'Rasio Online %'];
        $rows    = $data->map(fn ($r) => [
            $r->program_name,
            (int) $r->offline_count,
            (int) $r->online_count,
            (int) $r->total_count,
            $r->total_count > 0 ? round(($r->offline_count / $r->total_count) * 100, 1) . '%' : '0%',
            $r->total_count > 0 ? round(($r->online_count  / $r->total_count) * 100, 1) . '%' : '0%',
        ])->toArray();

        return [
            $headers,
            $rows,
            "pola-join-{$year}" . ($month ? "-bulan{$month}" : ''),
            "Pola Join Online/Offline {$year}",
        ];
    }

    // ── Siswa Stop ────────────────────────────────────────────────────────────

    private function buildSiswaStop(Request $request): array
    {
        $year = (int) $request->input('year', now()->year);

        $isSqlite   = \DB::connection()->getDriverName() === 'sqlite';
        $dateFormat = $isSqlite
            ? "strftime('%Y-%m', stopped_at)"
            : "DATE_FORMAT(stopped_at, '%Y-%m')";

        $query = Student::where('status', 'stop')
            ->whereNotNull('stopped_at')
            ->selectRaw("{$dateFormat} as month, count(*) as count")
            ->groupBy('month')
            ->orderBy('month', 'asc');

        $this->applyDateFilter($query, 'stopped_at', $year, null, $isSqlite);

        $data = $query->get();

        $headers = ['Bulan', 'Jumlah Siswa Stop'];
        $rows    = $data->map(fn ($r) => [$r->month ?? '-', (int) $r->count])->toArray();

        return [
            $headers,
            $rows,
            "siswa-stop-{$year}",
            "Tren Siswa Stop {$year}",
        ];
    }

    // ── Grades ───────────────────────────────────────────────────────────────

    private function buildGrades(Request $request): array
    {
        $year  = (int) $request->input('year', now()->year);
        $month = $request->input('month') ? (int) $request->input('month') : null;

        $isSqlite = \DB::connection()->getDriverName() === 'sqlite';

        $query = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->selectRaw("COALESCE(leads.grade, 'UMUM') as grade, count(*) as count")
            ->groupBy('grade');

        $this->applyDateFilter($query, 'students.start_join', $year, $month, $isSqlite);

        $raw = $query->get();

        $gradeGroups = ['PG' => 0, 'TK' => 0, 'SD' => 0, 'SMP' => 0, 'SMA' => 0, 'KULIAH' => 0, 'UMUM' => 0];
        foreach ($raw as $item) {
            $g = strtoupper(trim($item->grade));
            if (str_contains($g, 'PG') || str_contains($g, 'PLAYGROUP') || str_contains($g, 'KB')) {
                $gradeGroups['PG'] += $item->count;
            } elseif (str_contains($g, 'TK')) {
                $gradeGroups['TK'] += $item->count;
            } elseif (str_contains($g, 'SD')) {
                $gradeGroups['SD'] += $item->count;
            } elseif (str_contains($g, 'SMP')) {
                $gradeGroups['SMP'] += $item->count;
            } elseif (str_contains($g, 'SMA') || str_contains($g, 'SMK') || str_contains($g, 'SLTA')) {
                $gradeGroups['SMA'] += $item->count;
            } elseif (str_contains($g, 'KULIAH') || str_contains($g, 'UNIV') || str_contains($g, 'MHS')) {
                $gradeGroups['KULIAH'] += $item->count;
            } else {
                $gradeGroups['UMUM'] += $item->count;
            }
        }

        $headers = ['Tingkat Pendidikan', 'Jumlah Siswa'];
        $rows    = collect($gradeGroups)->map(fn ($count, $label) => [$label, (int) $count])->values()->toArray();

        return [
            $headers,
            $rows,
            "tingkat-pendidikan-{$year}" . ($month ? "-bulan{$month}" : ''),
            "Tingkat Pendidikan {$year}",
        ];
    }

    // ── Branch Monthly Matrix ──────────────────────────────────────────────

    public function buildBranchMatrix(Request $request): array
    {
        $year = (int) ($request->input('year') ?: now()->year);
        $branches = \App\Domains\Master\Domain\Models\Branch::orderBy('name')->get();

        $monthNames = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December'
        ];

        $matrixData = [];

        foreach ($branches as $branch) {
            $branchData = [
                'branch_name' => $branch->name,
                'year' => $year,
                'months' => [],
                'totals' => [
                    'group' => 0, 'private' => 0, 'ielts' => 0, 'toefl' => 0,
                    'total_active' => 0, 'inactive' => 0, 'total_students' => 0
                ],
                'averages' => [
                    'group' => 0, 'private' => 0, 'ielts' => 0, 'toefl' => 0,
                    'total_active' => 0, 'inactive' => 0, 'total_students' => 0
                ]
            ];

            $now = now();
            $monthsCounted = 0;

            for ($m = 1; $m <= 12; $m++) {
                $monthStart = \Carbon\Carbon::create($year, $m, 1)->startOfMonth();
                $monthEnd = \Carbon\Carbon::create($year, $m, 1)->endOfMonth();

                // If this is a future month in the current year, set to null/empty (or 0)
                $isFutureMonth = ($year == $now->year && $m > $now->month) || ($year > $now->year);

                if ($isFutureMonth) {
                    $branchData['months'][$m] = [
                        'month_name'     => $monthNames[$m],
                        'group'          => 0,
                        'private'        => 0,
                        'ielts'          => 0,
                        'toefl'          => 0,
                        'total_active'   => 0,
                        'inactive'       => 0,
                        'total_students' => 0,
                        'is_empty'       => true,
                    ];
                    continue;
                }

                $monthsCounted++;
                $isPastMonth = ($year < $now->year) || ($year == $now->year && $m < $now->month);

                // ── 1. Past Month: Try loading from frozen DB Snapshot ─────
                if ($isPastMonth) {
                    $snapshot = \App\Domains\Academic\Domain\Models\BranchMonthlyStudentSnapshot::where('branch_id', $branch->id)
                        ->where('year', $year)
                        ->where('month', $m)
                        ->first();

                    if ($snapshot) {
                        $branchData['months'][$m] = [
                            'month_name'     => $monthNames[$m],
                            'group'          => $snapshot->group_count,
                            'private'        => $snapshot->private_count,
                            'ielts'          => $snapshot->ielts_count,
                            'toefl'          => $snapshot->toefl_count,
                            'total_active'   => $snapshot->total_active_count,
                            'inactive'       => $snapshot->inactive_count,
                            'total_students' => $snapshot->total_students_count,
                            'is_empty'       => false,
                        ];

                        $branchData['totals']['group']          += $snapshot->group_count;
                        $branchData['totals']['private']        += $snapshot->private_count;
                        $branchData['totals']['ielts']          += $snapshot->ielts_count;
                        $branchData['totals']['toefl']          += $snapshot->toefl_count;
                        $branchData['totals']['total_active']   += $snapshot->total_active_count;
                        $branchData['totals']['inactive']       += $snapshot->inactive_count;
                        $branchData['totals']['total_students'] += $snapshot->total_students_count;
                        continue;
                    }
                }

                // ── 2. Current Month (or Past Month without Snapshot): Live Calculation ─
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

                // Auto-freeze snapshot if it's a past month
                if ($isPastMonth) {
                    \App\Domains\Academic\Domain\Models\BranchMonthlyStudentSnapshot::updateOrCreate(
                        ['branch_id' => $branch->id, 'year' => $year, 'month' => $m],
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
                }

                $branchData['months'][$m] = [
                    'month_name'     => $monthNames[$m],
                    'group'          => $groupCount,
                    'private'        => $privateCount,
                    'ielts'          => $ieltsCount,
                    'toefl'          => $toeflCount,
                    'total_active'   => $totalActive,
                    'inactive'       => $inactiveCount,
                    'total_students' => $totalStudents,
                    'is_empty'       => false,
                ];

                $branchData['totals']['group'] += $groupCount;
                $branchData['totals']['private'] += $privateCount;
                $branchData['totals']['ielts'] += $ieltsCount;
                $branchData['totals']['toefl'] += $toeflCount;
                $branchData['totals']['total_active'] += $totalActive;
                $branchData['totals']['inactive'] += $inactiveCount;
                $branchData['totals']['total_students'] += $totalStudents;
            }

            // Calculate averages based on elapsed months count (e.g. 5 if current month is May)
            $divisor = max(1, $monthsCounted);
            foreach ($branchData['totals'] as $key => $sum) {
                $branchData['averages'][$key] = (int) round($sum / $divisor);
            }

            $matrixData[] = $branchData;
        }

        $headers = ['Month', 'Group', 'Private', 'IELTS', 'TOEFL', 'Total', 'In Active', 'Total Students'];
        
        return [
            $headers,
            $matrixData, // passes full matrix struct
            "student-numbers-matrix-{$year}",
            "Student Numbers Campus {$year}",
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function applyDateFilter($query, string $col, int $year, ?int $month, bool $isSqlite): void
    {
        if ($isSqlite) {
            $query->whereRaw("cast(strftime('%Y', {$col}) as integer) = ?", [$year]);
            if ($month) {
                $query->whereRaw("cast(strftime('%m', {$col}) as integer) = ?", [$month]);
            }
        } else {
            $query->whereYear($col, $year);
            if ($month) {
                $query->whereMonth($col, $month);
            }
        }
    }

    private function buildMatrixExcelHtml(array $matrixData): string
    {
        $branchChunks = array_chunk($matrixData, 2);

        $html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        $html .= '<head><meta charset="UTF-8">';
        $html .= '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Student Numbers Matrix</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
        $html .= '<style>';
        $html .= 'body { font-family: Arial, sans-serif; font-size: 11px; }';
        $html .= 'table { border-collapse: collapse; margin-bottom: 20px; }';
        $html .= 'th, td { border: 1px solid #000000; padding: 5px 8px; text-align: center; font-size: 11px; }';
        $html .= 'th.title-header { font-size: 13px; font-weight: bold; text-align: center; border: 2px solid #000000; text-transform: uppercase; }';
        $html .= 'th.col-header { background-color: #d1d5db; font-weight: bold; border: 1px solid #000000; }';
        $html .= 'td.month-cell { text-align: left; }';
        $html .= 'tr.summary-row td { background-color: #9ca3af; font-weight: bold; border: 1px solid #000000; }';
        $html .= '</style></head><body>';

        foreach ($branchChunks as $chunk) {
            $b1 = $chunk[0] ?? null;
            $b2 = $chunk[1] ?? null;

            if (!$b1) continue;

            $html .= '<table><thead>';

            // Title Row
            $html .= '<tr>';
            $html .= '<th colspan="8" class="title-header">STUDENT NUMBERS ' . strtoupper($b1['branch_name']) . ' ' . $b1['year'] . '</th>';
            $html .= '<th style="border:none;"></th>';
            if ($b2) {
                $html .= '<th colspan="8" class="title-header">STUDENT NUMBERS ' . strtoupper($b2['branch_name']) . ' ' . $b2['year'] . '</th>';
            }
            $html .= '</tr>';

            // Column Header Row
            $cols = ['Month', 'Group', 'Private', 'IELTS', 'TOEFL', 'Total', 'In Active', 'Total Students'];
            $html .= '<tr>';
            foreach ($cols as $c) {
                $html .= '<th class="col-header">' . $c . '</th>';
            }
            $html .= '<th style="border:none;"></th>';
            if ($b2) {
                foreach ($cols as $c) {
                    $html .= '<th class="col-header">' . $c . '</th>';
                }
            }
            $html .= '</tr></thead><tbody>';

            // Month Rows
            for ($m = 1; $m <= 12; $m++) {
                $m1 = $b1['months'][$m];
                $html .= '<tr>';
                $html .= '<td class="month-cell">' . $m1['month_name'] . '</td>';
                if (!empty($m1['is_empty'])) {
                    $html .= '<td></td><td></td><td></td><td></td><td></td><td></td><td style="font-weight:bold;">0</td>';
                } else {
                    $html .= '<td>' . $m1['group'] . '</td>';
                    $html .= '<td>' . $m1['private'] . '</td>';
                    $html .= '<td>' . $m1['ielts'] . '</td>';
                    $html .= '<td>' . $m1['toefl'] . '</td>';
                    $html .= '<td>' . $m1['total_active'] . '</td>';
                    $html .= '<td>' . $m1['inactive'] . '</td>';
                    $html .= '<td style="font-weight:bold;">' . $m1['total_students'] . '</td>';
                }

                $html .= '<td style="border:none;"></td>';

                if ($b2) {
                    $m2 = $b2['months'][$m];
                    $html .= '<td class="month-cell">' . $m2['month_name'] . '</td>';
                    if (!empty($m2['is_empty'])) {
                        $html .= '<td></td><td></td><td></td><td></td><td></td><td></td><td style="font-weight:bold;">0</td>';
                    } else {
                        $html .= '<td>' . $m2['group'] . '</td>';
                        $html .= '<td>' . $m2['private'] . '</td>';
                        $html .= '<td>' . $m2['ielts'] . '</td>';
                        $html .= '<td>' . $m2['toefl'] . '</td>';
                        $html .= '<td>' . $m2['total_active'] . '</td>';
                        $html .= '<td>' . $m2['inactive'] . '</td>';
                        $html .= '<td style="font-weight:bold;">' . $m2['total_students'] . '</td>';
                    }
                }
                $html .= '</tr>';
            }

            // Total Row
            $t1 = $b1['totals'];
            $html .= '<tr class="summary-row">';
            $html .= '<td class="month-cell">Total</td>';
            $html .= '<td>' . $t1['group'] . '</td><td>' . $t1['private'] . '</td><td>' . $t1['ielts'] . '</td><td>' . $t1['toefl'] . '</td>';
            $html .= '<td>' . $t1['total_active'] . '</td><td>' . $t1['inactive'] . '</td><td>' . $t1['total_students'] . '</td>';
            $html .= '<td style="border:none;background:none;"></td>';

            if ($b2) {
                $t2 = $b2['totals'];
                $html .= '<td class="month-cell">Total</td>';
                $html .= '<td>' . $t2['group'] . '</td><td>' . $t2['private'] . '</td><td>' . $t2['ielts'] . '</td><td>' . $t2['toefl'] . '</td>';
                $html .= '<td>' . $t2['total_active'] . '</td><td>' . $t2['inactive'] . '</td><td>' . $t2['total_students'] . '</td>';
            }
            $html .= '</tr>';

            // Average Row
            $a1 = $b1['averages'];
            $html .= '<tr class="summary-row">';
            $html .= '<td class="month-cell">Average</td>';
            $html .= '<td>' . $a1['group'] . '</td><td>' . $a1['private'] . '</td><td>' . $a1['ielts'] . '</td><td>' . $a1['toefl'] . '</td>';
            $html .= '<td>' . $a1['total_active'] . '</td><td>' . $a1['inactive'] . '</td><td>' . $a1['total_students'] . '</td>';
            $html .= '<td style="border:none;background:none;"></td>';

            if ($b2) {
                $a2 = $b2['averages'];
                $html .= '<td class="month-cell">Average</td>';
                $html .= '<td>' . $a2['group'] . '</td><td>' . $a2['private'] . '</td><td>' . $a2['ielts'] . '</td><td>' . $a2['toefl'] . '</td>';
                $html .= '<td>' . $a2['total_active'] . '</td><td>' . $a2['inactive'] . '</td><td>' . $a2['total_students'] . '</td>';
            }
            $html .= '</tr>';

            $html .= '</tbody></table><br/><br/>';
        }

        $html .= '</body></html>';

        return $html;
    }

    private function makeDateHelper(): array
    {
        $isSqlite = \DB::connection()->getDriverName() === 'sqlite';
        $fn = function ($query, string $col, int $year, ?int $month = null) use ($isSqlite) {
            $this->applyDateFilter($query, $col, $year, $month, $isSqlite);
            return $query;
        };
        return [$fn];
    }

    private function buildMatrixCsv(array $matrixData): string
    {
        $handle = fopen('php://temp', 'r+');
        fputs($handle, "\xEF\xBB\xBF"); // BOM

        // We align branches 2 by 2 or side-by-side
        $branchChunks = array_chunk($matrixData, 2);

        foreach ($branchChunks as $chunk) {
            $b1 = $chunk[0] ?? null;
            $b2 = $chunk[1] ?? null;

            if (!$b1) continue;

            // Header 1: Branch Titles
            $titleRow = ["", "STUDENT NUMBERS " . strtoupper($b1['branch_name']) . " " . $b1['year'], "", "", "", "", "", "", ""];
            if ($b2) {
                $titleRow = array_merge($titleRow, ["", "STUDENT NUMBERS " . strtoupper($b2['branch_name']) . " " . $b2['year'], "", "", "", "", "", ""]);
            }
            fputcsv($handle, $titleRow);

            // Header 2: Column Names
            $cols = ['Month', 'Group', 'Private', 'IELTS', 'TOEFL', 'Total', 'In Active', 'Total Students'];
            $colRow = array_merge([""], $cols, [""]);
            if ($b2) {
                $colRow = array_merge($colRow, $cols);
            }
            fputcsv($handle, $colRow);

            // Month Rows (1 to 12)
            for ($m = 1; $m <= 12; $m++) {
                $m1 = $b1['months'][$m];
                if (!empty($m1['is_empty'])) {
                    $row = ["", $m1['month_name'], "", "", "", "", "", "", 0, ""];
                } else {
                    $row = ["", $m1['month_name'], $m1['group'], $m1['private'], $m1['ielts'], $m1['toefl'], $m1['total_active'], $m1['inactive'], $m1['total_students'], ""];
                }

                if ($b2) {
                    $m2 = $b2['months'][$m];
                    if (!empty($m2['is_empty'])) {
                        $row = array_merge($row, [$m2['month_name'], "", "", "", "", "", "", 0]);
                    } else {
                        $row = array_merge($row, [$m2['month_name'], $m2['group'], $m2['private'], $m2['ielts'], $m2['toefl'], $m2['total_active'], $m2['inactive'], $m2['total_students']]);
                    }
                }
                fputcsv($handle, $row);
            }

            // Totals Row
            $t1 = $b1['totals'];
            $totRow = ["", "Total", $t1['group'], $t1['private'], $t1['ielts'], $t1['toefl'], $t1['total_active'], $t1['inactive'], $t1['total_students'], ""];
            if ($b2) {
                $t2 = $b2['totals'];
                $totRow = array_merge($totRow, ["Total", $t2['group'], $t2['private'], $t2['ielts'], $t2['toefl'], $t2['total_active'], $t2['inactive'], $t2['total_students']]);
            }
            fputcsv($handle, $totRow);

            // Averages Row
            $a1 = $b1['averages'];
            $avgRow = ["", "Average", $a1['group'], $a1['private'], $a1['ielts'], $a1['toefl'], $a1['total_active'], $a1['inactive'], $a1['total_students'], ""];
            if ($b2) {
                $a2 = $b2['averages'];
                $avgRow = array_merge($avgRow, ["Average", $a2['group'], $a2['private'], $a2['ielts'], $a2['toefl'], $a2['total_active'], $a2['inactive'], $a2['total_students']]);
            }
            fputcsv($handle, $avgRow);

            // Empty spacer row between chunks
            fputcsv($handle, []);
            fputcsv($handle, []);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);
        return $csv;
    }

    private function buildCsv(array $headers, array $rows): string
    {
        $handle = fopen('php://temp', 'r+');
        // BOM for Excel UTF-8
        fputs($handle, "\xEF\xBB\xBF");
        fputcsv($handle, $headers);
        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);
        return $csv;
    }
}
