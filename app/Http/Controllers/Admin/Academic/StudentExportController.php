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

        if ($tab === 'join_patterns') {
            $pivotData = $this->buildJoinPatternsPivot($request);
            $content = view('pdf.join-pattern-export', $pivotData)->render();
            return response($content, 200, [
                'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$pivotData['filename']}.xls\"",
            ]);
        }

        if ($tab === 'join_invoices') {
            $invoiceData = $this->buildJoinInvoicesData($request);
            $content = view('pdf.join-invoices-export', $invoiceData)->render();
            return response($content, 200, [
                'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$invoiceData['filename']}.xls\"",
            ]);
        }

        if ($tab === 'join_grades') {
            $gradeData = $this->buildJoinGradesData($request);
            $content = view('pdf.join-grades-export', $gradeData)->render();
            return response($content, 200, [
                'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$gradeData['filename']}.xls\"",
            ]);
        }

        if (in_array($tab, ['siswa_stop_packages', 'siswa_stop_programs', 'siswa_stop_grades'])) {
            $groupType = str_replace('siswa_stop_', '', $tab);
            $stopData = $this->buildSiswaStopPivotData($request, $groupType);
            $content = view('pdf.siswa-stop-export', $stopData)->render();
            return response($content, 200, [
                'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$stopData['filename']}.xls\"",
            ]);
        }

        [$headers, $rows, $filename] = $this->buildData($request, $tab);

        if (in_array($tab, ['overall', 'branch_matrix'])) {
            $content = $this->buildMatrixExcelHtml($rows);
            return response($content, 200, [
                'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}.xls\"",
            ]);
        }

        if ($tab === 'list') {
            $content = $this->buildStudentListExcelHtml($headers, $rows);
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
     * Export as PDF file download attachment.
     */
    public function exportPdf(Request $request)
    {
        ini_set('memory_limit', '1024M');
        ini_set('max_execution_time', '300');

        $tab = $request->input('tab', 'list');

        if ($tab === 'join_patterns') {
            $pivotData = $this->buildJoinPatternsPivot($request);
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.join-pattern-export', $pivotData)
                ->setPaper('a4', 'landscape')
                ->setOptions([
                    'isHtml5ParserEnabled' => false,
                    'isPhpEnabled' => true,
                    'enable_font_subsetting' => false,
                ]);
            return $pdf->download("{$pivotData['filename']}.pdf");
        }

        if ($tab === 'join_invoices') {
            $invoiceData = $this->buildJoinInvoicesData($request);
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.join-invoices-export', $invoiceData)
                ->setPaper('a4', 'landscape')
                ->setOptions([
                    'isHtml5ParserEnabled' => false,
                    'isPhpEnabled' => true,
                    'enable_font_subsetting' => false,
                ]);
            return $pdf->download("{$invoiceData['filename']}.pdf");
        }

        if ($tab === 'join_grades') {
            $gradeData = $this->buildJoinGradesData($request);
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.join-grades-export', $gradeData)
                ->setPaper('a4', 'landscape')
                ->setOptions([
                    'isHtml5ParserEnabled' => false,
                    'isPhpEnabled' => true,
                    'enable_font_subsetting' => false,
                ]);
            return $pdf->download("{$gradeData['filename']}.pdf");
        }

        if (in_array($tab, ['siswa_stop_packages', 'siswa_stop_programs', 'siswa_stop_grades'])) {
            $groupType = str_replace('siswa_stop_', '', $tab);
            $stopData = $this->buildSiswaStopPivotData($request, $groupType);
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.siswa-stop-export', $stopData)
                ->setPaper('a4', 'landscape')
                ->setOptions([
                    'isHtml5ParserEnabled' => false,
                    'isPhpEnabled' => true,
                    'enable_font_subsetting' => false,
                ]);
            return $pdf->download("{$stopData['filename']}.pdf");
        }

        [$headers, $rows, $filename, $title] = $this->buildData($request, $tab);

        $year  = $request->input('year', now()->year);
        $month = $request->input('month');

        if (in_array($tab, ['overall', 'branch_matrix'])) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.branch-monthly-matrix', [
                'matrixData' => $rows,
                'year'       => $year,
                'filename'   => $filename,
            ])->setPaper('a4', 'landscape')
              ->setOptions([
                  'isHtml5ParserEnabled' => false,
                  'isPhpEnabled' => true,
                  'enable_font_subsetting' => false,
              ]);

            return $pdf->download("{$filename}.pdf");
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.student-export', [
            'title'    => $title,
            'headers'  => $headers,
            'rows'     => $rows,
            'filename' => $filename,
            'year'     => $year,
            'month'    => $month,
            'tab'      => $tab,
        ])->setPaper('a4', 'landscape')
          ->setOptions([
              'isHtml5ParserEnabled' => false,
              'isPhpEnabled' => true,
              'enable_font_subsetting' => false,
          ]);

        return $pdf->download("{$filename}.pdf");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Data builders
    // ─────────────────────────────────────────────────────────────────────────

    private function buildData(Request $request, string $tab): array
    {
        return match ($tab) {
            'list'          => $this->buildStudentList($request),
            'branch_matrix' => $this->buildBranchMatrix($request),
            'overall'       => $this->buildBranchMatrix($request),
            'join_patterns' => $this->buildJoinPatterns($request),
            'siswa_stop'      => $this->buildSiswaStop($request),
            'class_transfers' => $this->buildClassTransfers($request),
            'grades'          => $this->buildGrades($request),
            default           => $this->buildStudentList($request),
        };
    }

    // ── List ─────────────────────────────────────────────────────────────────

    private function buildStudentList(Request $request): array
    {
        $query = Student::with(['lead.branch', 'studyClasses'])
            ->select('students.*');

        $appliedFilters = [];

        if ($request->filled('loyalty_tier')) {
            $tier = $request->loyalty_tier;
            if ($tier === 'none') {
                $appliedFilters['Loyalty Tier'] = 'Tanpa Tier';
                $query->where(function ($q) {
                    $q->whereNull('loyalty_tier')->orWhere('loyalty_tier', '');
                });
            } else {
                $appliedFilters['Loyalty Tier'] = strtoupper($tier);
                $query->where('loyalty_tier', $tier);
            }
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $appliedFilters['Pencarian'] = "\"{$s}\"";
            $query->where(function ($q) use ($s) {
                $q->whereHas('lead', fn ($lq) =>
                    $lq->where('name', 'like', "%{$s}%")->orWhere('phone', 'like', "%{$s}%")
                )->orWhere('student_number', 'like', "%{$s}%");
            });
        }

        if ($request->filled('class_category')) {
            $cat = strtolower($request->class_category);
            $appliedFilters['Kategori Kelas'] = strtoupper($cat);
            $query->whereHas('studyClasses', fn ($q) => $q->where('category', $cat));
        }

        if ($request->filled('study_class_id')) {
            $sc = StudyClass::find($request->study_class_id);
            $appliedFilters['Kelas'] = $sc?->name ?? "ID #{$request->study_class_id}";
            $query->whereHas('studyClasses', fn ($q) =>
                $q->where('study_classes.id', $request->study_class_id)
            );
        }

        if ($request->filled('grade')) {
            $g = trim($request->grade);
            $gUpper = strtoupper($g);
            $appliedFilters['Tingkat Sekolah'] = $g;
            $query->whereHas('lead', function ($q) use ($g, $gUpper) {
                if (in_array($gUpper, ['TK / PAUD', 'TK', 'PAUD'])) {
                    $q->where(function ($sub) {
                        $sub->where('grade', 'like', '%TK%')
                            ->orWhere('grade', 'like', '%PAUD%')
                            ->orWhere('grade', 'like', '%PLAYGROUP%')
                            ->orWhere('grade', 'like', '%KB%')
                            ->orWhere('school_level', 'like', '%TK%')
                            ->orWhere('school_level', 'like', '%PAUD%');
                    });
                } elseif ($gUpper === 'SD') {
                    $q->where(function ($sub) {
                        $sub->where('grade', 'like', 'SD%')
                            ->orWhere('grade', 'like', '% SD%')
                            ->orWhere('school_level', 'SD')
                            ->orWhere('grade', 'like', 'Kelas 1%')
                            ->orWhere('grade', 'like', 'Kelas 2%')
                            ->orWhere('grade', 'like', 'Kelas 3%')
                            ->orWhere('grade', 'like', 'Kelas 4%')
                            ->orWhere('grade', 'like', 'Kelas 5%')
                            ->orWhere('grade', 'like', 'Kelas 6%');
                    });
                } elseif ($gUpper === 'SMP') {
                    $q->where(function ($sub) {
                        $sub->where('grade', 'like', 'SMP%')
                            ->orWhere('grade', 'like', '% SMP%')
                            ->orWhere('school_level', 'SMP')
                            ->orWhere('grade', 'like', 'Kelas 7%')
                            ->orWhere('grade', 'like', 'Kelas 8%')
                            ->orWhere('grade', 'like', 'Kelas 9%');
                    });
                } elseif (in_array($gUpper, ['SMA / SMK', 'SMA', 'SMK'])) {
                    $q->where(function ($sub) {
                        $sub->where('grade', 'like', 'SMA%')
                            ->orWhere('grade', 'like', 'SMK%')
                            ->orWhere('grade', 'like', '% SMA%')
                            ->orWhere('grade', 'like', '% SMK%')
                            ->orWhere('school_level', 'SMA')
                            ->orWhere('school_level', 'SMK')
                            ->orWhere('grade', 'like', 'Kelas 10%')
                            ->orWhere('grade', 'like', 'Kelas 11%')
                            ->orWhere('grade', 'like', 'Kelas 12%');
                    });
                } elseif ($gUpper === 'UMUM') {
                    $q->where(function ($sub) {
                        $sub->where('grade', 'like', '%UMUM%')
                            ->orWhere('grade', 'like', '%KULIAH%')
                            ->orWhere('grade', 'like', '%KERJA%')
                            ->orWhere('school_level', 'UMUM')
                            ->orWhere('school_level', 'Kuliah')
                            ->orWhere('school_level', 'Kerja');
                    });
                } else {
                    $q->where('grade', $g);
                }
            });
        }

        if ($request->filled('branch_id')) {
            $bId = $request->branch_id;
            $branchName = \DB::table('branches')->where('id', $bId)->value('name');
            $appliedFilters['Cabang'] = $branchName ?? "ID #{$bId}";
            $query->whereHas('lead', fn ($q) => $q->where('branch_id', $bId));
        }

        if ($request->filled('expiry_status')) {
            $status = $request->expiry_status;
            $expiryLabels = [
                'expired'       => 'Sudah Expired',
                'expiring_soon' => 'Expired Dalam 3 Minggu',
                'not_expired'   => 'Masa Aktif > 3 Minggu',
            ];
            $appliedFilters['Masa Aktif'] = $expiryLabels[$status] ?? $status;

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

        $statusFilter = $request->input('status', 'active');
        if ($statusFilter !== 'all' && $statusFilter !== '') {
            $appliedFilters['Status Siswa'] = strtoupper($statusFilter);
            $query->where('status', $statusFilter);
        }

        $allStudents = $query->orderBy('created_at', 'desc')->get();

        $mapRow = function ($s, $i) {
            $lead = $s->lead;
            $fullAddress = collect([
                $lead?->address,
                $lead?->city,
                $lead?->province
            ])->filter()->implode(', ') ?: '-';

            return [
                'no'             => $i + 1,
                'student_number' => $s->student_number ?? '-',
                'name'           => $lead?->name ?? '-',
                'phone'          => $lead?->phone ?? '-',
                'branch'         => $lead?->branch?->name ?? 'Central',
                'school'         => $lead?->school ?? '-',
                'grade'          => $lead ? ($lead->school_level ? "{$lead->grade} ({$lead->school_level})" : ($lead->grade ?? '-')) : '-',
                'address'        => $fullAddress,
                'class'          => $s->studyClasses->pluck('name')->implode(', ') ?: '-',
                'start_join'     => $s->start_join ? \Carbon\Carbon::parse($s->start_join)->format('d M Y') : '-',
                'status'         => strtoupper($s->status ?? 'ACTIVE'),
            ];
        };

        $activeRows = $allStudents->filter(fn($s) => $s->status !== 'stop')->values()->map($mapRow)->toArray();
        $stopRows   = $allStudents->filter(fn($s) => $s->status === 'stop')->values()->map($mapRow)->toArray();

        $headers = [
            'No', 'No. Siswa', 'Nama Siswa', 'No. HP', 'Cabang', 
            'Sekolah', 'Tingkat/Kelas', 'Alamat Lengkap', 'Kelas Aktif', 'Tanggal Join', 'Status'
        ];

        return [
            $headers,
            [
                'active'  => $activeRows,
                'stop'    => $stopRows,
                'filters' => $appliedFilters,
            ],
            'daftar-siswa-lengkap-' . now()->format('Y-m-d'),
            'Daftar Siswa Lengkap'
        ];
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

    private function buildJoinPatternsPivot(Request $request): array
    {
        $year       = (int) $request->input('year', now()->year);
        $month      = $request->input('month') ? (int) $request->input('month') : null;
        $modeFilter = $request->input('mode');
        $branchId   = $request->input('branch_id') ?: null;

        $branchName = null;
        if ($branchId) {
            $branchName = \DB::table('branches')->where('id', $branchId)->value('name');
        }

        $isSqlite = \DB::connection()->getDriverName() === 'sqlite';

        $monthExpr = $isSqlite
            ? "CAST(strftime('%m', le.joined_at) AS INTEGER)"
            : "MONTH(le.joined_at)";

        $yearExprLE = $isSqlite
            ? "CAST(strftime('%Y', le.joined_at) AS INTEGER)"
            : "YEAR(le.joined_at)";

        $joinQueryBuilder = \DB::table('lead_enrollments as le')
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

        // Siswa Out (Stopped Students) per month & mode
        $monthExprStopped = $isSqlite
            ? "CAST(strftime('%m', s.stopped_at) AS INTEGER)"
            : "MONTH(s.stopped_at)";

        $yearExprStopped = $isSqlite
            ? "CAST(strftime('%Y', s.stopped_at) AS INTEGER)"
            : "YEAR(s.stopped_at)";

        $stoppedQueryBuilder = \DB::table('students as s')
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

        // Monthly student snapshots count (Total Students)
        $snapshotQuery = \DB::table('branch_monthly_student_snapshots')
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

        $realtimeQuery = \DB::table('lead_enrollments as le')
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

        if ($month) {
            $pivotMonths = array_values(array_filter($pivotMonths, fn($m) => $m['month'] === $month));
        }

        return [
            'title'         => "Pola Join Siswa {$year}" . ($branchName ? " ({$branchName})" : '') . ($month ? " Bulan {$month}" : ''),
            'filename'      => "pola-join-{$year}" . ($branchId ? "-branch{$branchId}" : '') . ($month ? "-bulan{$month}" : ''),
            'year'          => $year,
            'month'         => $month,
            'modeFilter'    => $modeFilter,
            'branchName'    => $branchName,
            'packageList'   => $allPackages,
            'months'        => $pivotMonths,
            'totals'        => $totals,
            'stoppedTotals' => $stoppedTotals,
        ];
    }

    private function buildJoinInvoicesData(Request $request): array
    {
        $year       = (int) $request->input('year', now()->year);
        $month      = $request->input('month') ? (int) $request->input('month') : null;
        $modeFilter = $request->input('mode');
        $branchId   = $request->input('branch_id') ?: null;

        $branchName = null;
        if ($branchId) {
            $branchName = \DB::table('branches')->where('id', $branchId)->value('name');
        }

        $isSqlite = \DB::connection()->getDriverName() === 'sqlite';

        $monthExpr = $isSqlite
            ? "CAST(strftime('%m', le.joined_at) AS INTEGER)"
            : "MONTH(le.joined_at)";

        $yearExprLE = $isSqlite
            ? "CAST(strftime('%Y', le.joined_at) AS INTEGER)"
            : "YEAR(le.joined_at)";

        $query = \DB::table('lead_enrollments as le')
            ->join('study_classes as sc', 'le.study_class_id', '=', 'sc.id')
            ->join('price_masters as pm', 'sc.price_master_id', '=', 'pm.id')
            ->leftJoin('leads as l', 'le.lead_id', '=', 'l.id')
            ->leftJoin('invoices as inv', function ($join) {
                $join->on('le.student_id', '=', 'inv.student_id')
                     ->on('le.study_class_id', '=', 'inv.study_class_id');
            })
            ->selectRaw("
                {$monthExpr} AS month_num,
                pm.name      AS package_name,
                sc.type      AS delivery_mode,
                COALESCE(inv.type, 'new_join') AS inv_type,
                COUNT(le.id) AS student_count
            ")
            ->whereRaw("{$yearExprLE} = ?", [$year]);

        if ($month) {
            $query->whereRaw("{$monthExpr} = ?", [$month]);
        }

        if ($modeFilter && in_array($modeFilter, ['online', 'offline'])) {
            $query->where('sc.type', '=', $modeFilter);
        }

        if ($branchId) {
            $query->where('l.branch_id', '=', $branchId);
        }

        $rawRows = $query
            ->groupByRaw("{$monthExpr}, pm.name, sc.type, COALESCE(inv.type, 'new_join')")
            ->get();

        $allPackages = $rawRows->pluck('package_name')->unique()->sort()->values()->toArray();

        // Build structure: month -> mode ('offline'/'online') -> package -> { new, extend }
        $pivotOffline = [];
        $pivotOnline  = [];
        $totalsOffline = [];
        $totalsOnline  = [];

        foreach ($allPackages as $pkg) {
            $totalsOffline[$pkg] = ['new' => 0, 'extend' => 0];
            $totalsOnline[$pkg]  = ['new' => 0, 'extend' => 0];
        }

        foreach ($rawRows as $r) {
            $mNum = (int) $r->month_num;
            $pkg  = $r->package_name;
            $mode = $r->delivery_mode ?: 'offline';
            $tRaw = strtolower($r->inv_type ?? 'new_join');

            $category = 'new';
            if (str_contains($tRaw, 'lanjut') || str_contains($tRaw, 'extend') || str_contains($tRaw, 'continue') || str_contains($tRaw, 'rejoin') || str_contains($tRaw, 'renewal')) {
                $category = 'extend';
            }

            $cnt = (int) $r->student_count;

            if ($mode === 'online') {
                if (!isset($pivotOnline[$mNum][$pkg])) $pivotOnline[$mNum][$pkg] = ['new' => 0, 'extend' => 0];
                $pivotOnline[$mNum][$pkg][$category] = ($pivotOnline[$mNum][$pkg][$category] ?? 0) + $cnt;
                $totalsOnline[$pkg][$category] += $cnt;
            } else {
                if (!isset($pivotOffline[$mNum][$pkg])) $pivotOffline[$mNum][$pkg] = ['new' => 0, 'extend' => 0];
                $pivotOffline[$mNum][$pkg][$category] = ($pivotOffline[$mNum][$pkg][$category] ?? 0) + $cnt;
                $totalsOffline[$pkg][$category] += $cnt;
            }
        }

        $monthLabels = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'Sept', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec',
        ];

        $pivotMonths = [];
        foreach ($monthLabels as $num => $label) {
            $pkgsOff = [];
            $pkgsOn  = [];
            foreach ($allPackages as $pkg) {
                $pkgsOff[$pkg] = $pivotOffline[$num][$pkg] ?? ['new' => 0, 'extend' => 0];
                $pkgsOn[$pkg]  = $pivotOnline[$num][$pkg]  ?? ['new' => 0, 'extend' => 0];
            }
            $pivotMonths[] = [
                'month'            => $num,
                'label'            => $label,
                'packages_offline' => $pkgsOff,
                'packages_online'  => $pkgsOn,
            ];
        }

        if ($month) {
            $pivotMonths = array_values(array_filter($pivotMonths, fn($m) => $m['month'] === $month));
        }

        return [
            'title'          => "Pola Join New & Extend {$year}" . ($branchName ? " ({$branchName})" : '') . ($month ? " Bulan {$month}" : ''),
            'filename'       => "pola-join-new-extend-{$year}" . ($branchId ? "-branch{$branchId}" : '') . ($month ? "-bulan{$month}" : ''),
            'year'           => $year,
            'month'          => $month,
            'modeFilter'     => $modeFilter,
            'branchName'     => $branchName,
            'packageList'    => $allPackages,
            'months'         => $pivotMonths,
            'totals_offline' => $totalsOffline,
            'totals_online'  => $totalsOnline,
        ];
    }

    private function buildJoinGradesData(Request $request): array
    {
        $year       = (int) $request->input('year', now()->year);
        $month      = $request->input('month') ? (int) $request->input('month') : null;
        $modeFilter = $request->input('mode');
        $branchId   = $request->input('branch_id') ?: null;

        $branchName = null;
        if ($branchId) {
            $branchName = \DB::table('branches')->where('id', $branchId)->value('name');
        }

        $isSqlite = \DB::connection()->getDriverName() === 'sqlite';

        $monthExpr = $isSqlite
            ? "CAST(strftime('%m', le.joined_at) AS INTEGER)"
            : "MONTH(le.joined_at)";

        $yearExprLE = $isSqlite
            ? "CAST(strftime('%Y', le.joined_at) AS INTEGER)"
            : "YEAR(le.joined_at)";

        $query = \DB::table('lead_enrollments as le')
            ->join('study_classes as sc', 'le.study_class_id', '=', 'sc.id')
            ->leftJoin('leads as l', 'le.lead_id', '=', 'l.id')
            ->selectRaw("
                {$monthExpr} AS month_num,
                COALESCE(NULLIF(l.grade, ''), 'Tidak Terdefinisi') AS grade_name,
                sc.type AS delivery_mode,
                COUNT(le.id) AS student_count
            ")
            ->whereRaw("{$yearExprLE} = ?", [$year]);

        if ($month) {
            $query->whereRaw("{$monthExpr} = ?", [$month]);
        }

        if ($modeFilter && in_array($modeFilter, ['online', 'offline'])) {
            $query->where('sc.type', '=', $modeFilter);
        }

        if ($branchId) {
            $query->where('l.branch_id', '=', $branchId);
        }

        $rawRows = $query
            ->groupByRaw("{$monthExpr}, COALESCE(NULLIF(l.grade, ''), 'Tidak Terdefinisi'), sc.type")
            ->get();

        $allGrades = ['TK / PAUD', 'SD', 'SMP', 'SMA / SMK', 'Mahasiswa', 'Umum', 'Tidak Terdefinisi'];

        $pivotOffline  = [];
        $pivotOnline   = [];
        $totalsOffline = array_fill_keys($allGrades, 0);
        $totalsOnline  = array_fill_keys($allGrades, 0);

        foreach ($rawRows as $r) {
            $mNum  = (int) $r->month_num;
            $grade = $this->normalizeGradeCategory($r->grade_name);
            $mode  = $r->delivery_mode ?: 'offline';
            $cnt   = (int) $r->student_count;

            if ($mode === 'online') {
                $pivotOnline[$mNum][$grade] = ($pivotOnline[$mNum][$grade] ?? 0) + $cnt;
                $totalsOnline[$grade] = ($totalsOnline[$grade] ?? 0) + $cnt;
            } else {
                $pivotOffline[$mNum][$grade] = ($pivotOffline[$mNum][$grade] ?? 0) + $cnt;
                $totalsOffline[$grade] = ($totalsOffline[$grade] ?? 0) + $cnt;
            }
        }

        $monthLabels = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'Sept', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec',
        ];

        $pivotMonths = [];
        foreach ($monthLabels as $num => $label) {
            $grOff = [];
            $grOn  = [];
            foreach ($allGrades as $g) {
                $grOff[$g] = $pivotOffline[$num][$g] ?? 0;
                $grOn[$g]  = $pivotOnline[$num][$g]  ?? 0;
            }
            $pivotMonths[] = [
                'month'          => $num,
                'label'          => $label,
                'grades_offline' => $grOff,
                'grades_online'  => $grOn,
            ];
        }

        if ($month) {
            $pivotMonths = array_values(array_filter($pivotMonths, fn($m) => $m['month'] === $month));
        }

        return [
            'title'          => "Pola Join Based on Grades {$year}" . ($branchName ? " ({$branchName})" : '') . ($month ? " Bulan {$month}" : ''),
            'filename'       => "pola-join-grades-{$year}" . ($branchId ? "-branch{$branchId}" : '') . ($month ? "-bulan{$month}" : ''),
            'year'           => $year,
            'month'          => $month,
            'modeFilter'     => $modeFilter,
            'branchName'     => $branchName,
            'gradeList'      => $allGrades,
            'months'         => $pivotMonths,
            'totals_offline' => $totalsOffline,
            'totals_online'  => $totalsOnline,
        ];
    }

    private function buildSiswaStopPivotData(Request $request, string $groupByType): array
    {
        $year       = (int) $request->input('year', now()->year);
        $month      = $request->input('month') ? (int) $request->input('month') : null;
        $modeFilter = $request->input('mode');
        $branchId   = $request->input('branch_id') ?: null;

        $branchName = null;
        if ($branchId) {
            $branchName = \DB::table('branches')->where('id', $branchId)->value('name');
        }

        $isSqlite = \DB::connection()->getDriverName() === 'sqlite';
        $monthExpr = $isSqlite
            ? "CAST(strftime('%m', s.stopped_at) AS INTEGER)"
            : "MONTH(s.stopped_at)";

        $yearExprStop = $isSqlite
            ? "CAST(strftime('%Y', s.stopped_at) AS INTEGER)"
            : "YEAR(s.stopped_at)";

        $query = \DB::table('students as s')
            ->leftJoin('leads as l', 's.lead_id', '=', 'l.id')
            ->leftJoin('lead_enrollments as le', function ($join) {
                $join->on('s.id', '=', 'le.student_id')
                     ->whereRaw('(le.joined_at <= s.stopped_at OR s.stopped_at IS NULL)');
            })
            ->leftJoin('study_classes as sc', 'le.study_class_id', '=', 'sc.id')
            ->leftJoin('price_masters as pm', 'sc.price_master_id', '=', 'pm.id')
            ->leftJoin('lead_types as lt', 'l.lead_type_id', '=', 'lt.id')
            ->where('s.status', '=', 'stop')
            ->whereNotNull('s.stopped_at')
            ->whereRaw("{$yearExprStop} = ?", [$year]);

        if ($month) {
            $query->whereRaw("{$monthExpr} = ?", [$month]);
        }

        if ($modeFilter && in_array($modeFilter, ['online', 'offline'])) {
            $query->where('sc.type', '=', $modeFilter);
        }

        if ($branchId) {
            $query->where('l.branch_id', '=', $branchId);
        }

        $colExpr = "COALESCE(NULLIF(pm.name, ''), 'Tidak Terdefinisi')";
        $subTitle = "Based on Paket Harga";
        $dbPriceMasters = \DB::table('price_masters')->orderBy('name')->pluck('name')->toArray();
        $defaultCols = array_values(array_unique(array_merge($dbPriceMasters, ['Tidak Terdefinisi'])));

        if ($groupByType === 'programs') {
            $colExpr = "COALESCE(NULLIF(sc.category, ''), COALESCE(NULLIF(lt.name, ''), 'Tidak Terdefinisi'))";
            $subTitle = "Based on Program / Lead Type";
            $dbLeadTypes = \DB::table('lead_types')->orderBy('name')->pluck('name')->toArray();
            $dbClassCategories = \DB::table('study_classes')->whereNotNull('category')->where('category', '!=', '')->pluck('category')->toArray();
            $defaultCols = array_values(array_unique(array_merge($dbLeadTypes, $dbClassCategories, ['Tidak Terdefinisi'])));
        } elseif ($groupByType === 'grades') {
            $colExpr = "COALESCE(NULLIF(l.grade, ''), 'Tidak Terdefinisi')";
            $subTitle = "Based on Grades (Tingkat Pendidikan)";
            $defaultCols = ['TK / PAUD', 'SD', 'SMP', 'SMA / SMK', 'Mahasiswa', 'Umum', 'Tidak Terdefinisi'];
        }

        $query->selectRaw("
            {$monthExpr} AS month_num,
            {$colExpr}   AS col_name,
            sc.type      AS delivery_mode,
            COUNT(DISTINCT s.id) AS stop_count
        ")->groupByRaw("{$monthExpr}, {$colExpr}, sc.type");

        $rawRows = $query->get();

        $allCols = $groupByType === 'grades'
            ? ['TK / PAUD', 'SD', 'SMP', 'SMA / SMK', 'Mahasiswa', 'Umum', 'Tidak Terdefinisi']
            : array_values(array_unique(array_merge($defaultCols, $rawRows->pluck('col_name')->filter()->unique()->toArray())));

        $pivotOffline  = [];
        $pivotOnline   = [];
        $totalsOffline = array_fill_keys($allCols, 0);
        $totalsOnline  = array_fill_keys($allCols, 0);

        foreach ($rawRows as $r) {
            $mNum = (int) $r->month_num;
            $col  = $groupByType === 'grades' ? $this->normalizeGradeCategory($r->col_name) : ($r->col_name ?: 'Tidak Terdefinisi');
            $mode = $r->delivery_mode ?: 'offline';
            $cnt  = (int) $r->stop_count;

            if ($mode === 'online') {
                $pivotOnline[$mNum][$col] = ($pivotOnline[$mNum][$col] ?? 0) + $cnt;
                $totalsOnline[$col] = ($totalsOnline[$col] ?? 0) + $cnt;
            } else {
                $pivotOffline[$mNum][$col] = ($pivotOffline[$mNum][$col] ?? 0) + $cnt;
                $totalsOffline[$col] = ($totalsOffline[$col] ?? 0) + $cnt;
            }
        }

        $monthLabels = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'Sept', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec',
        ];

        $pivotMonths = [];
        foreach ($monthLabels as $num => $label) {
            $off = [];
            $on  = [];
            foreach ($allCols as $c) {
                $off[$c] = $pivotOffline[$num][$c] ?? 0;
                $on[$c]  = $pivotOnline[$num][$c]  ?? 0;
            }
            $pivotMonths[] = [
                'month'   => $num,
                'label'   => $label,
                'offline' => $off,
                'online'  => $on,
            ];
        }

        if ($month) {
            $pivotMonths = array_values(array_filter($pivotMonths, fn($m) => $m['month'] === $month));
        }

        return [
            'title'          => "Laporan Siswa Stop {$year}" . ($branchName ? " ({$branchName})" : '') . ($month ? " Bulan {$month}" : ''),
            'subTitle'       => $subTitle,
            'filename'       => "siswa-stop-{$groupByType}-{$year}" . ($branchId ? "-branch{$branchId}" : '') . ($month ? "-bulan{$month}" : ''),
            'year'           => $year,
            'month'          => $month,
            'modeFilter'     => $modeFilter,
            'branchName'     => $branchName,
            'columns'        => $allCols,
            'months'         => $pivotMonths,
            'totals_offline' => $totalsOffline,
            'totals_online'  => $totalsOnline,
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
        $targetList = [];

        foreach ($branches as $branch) {
            if (strtoupper($branch->code ?? $branch->name) === 'SOLO' || str_contains(strtoupper($branch->name), 'SOLO')) {
                $targetList[] = [
                    'branch'     => $branch,
                    'title_name' => 'SOLO (ON CAMPUS / OFFLINE)',
                    'mode'       => 'offline',
                ];
                $targetList[] = [
                    'branch'     => $branch,
                    'title_name' => 'SOLO (ONLINE)',
                    'mode'       => 'online',
                ];
            } else {
                $targetList[] = [
                    'branch'     => $branch,
                    'title_name' => strtoupper($branch->name),
                    'mode'       => null,
                ];
            }
        }

        foreach ($targetList as $item) {
            $branch = $item['branch'];
            $titleName = $item['title_name'];
            $modeFilter = $item['mode'];

            $branchData = [
                'branch_name' => $titleName,
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

                // If this is a future month in the current year, set to null/empty
                $isFutureMonth = ($year == $now->year && $m > $now->month) || ($year > $now->year);

                if ($isFutureMonth) {
                    $branchData['months'][$m] = [
                        'month_name'     => $monthNames[$m],
                        'group'          => '',
                        'private'        => '',
                        'ielts'          => '',
                        'toefl'          => '',
                        'total_active'   => '',
                        'inactive'       => '',
                        'total_students' => 0,
                        'is_empty'       => true,
                    ];
                    continue;
                }

                $monthsCounted++;
                $isPastMonth = ($year < $now->year) || ($year == $now->year && $m < $now->month);

                // ── 1. Past Month: Load from frozen DB Snapshot if available ─────
                if ($isPastMonth) {
                    $snapshotQuery = \App\Domains\Academic\Domain\Models\BranchMonthlyStudentSnapshot::where('branch_id', $branch->id)
                        ->where('year', $year)
                        ->where('month', $m);

                    $snapshot = $snapshotQuery->first();

                    if ($snapshot && (int) $snapshot->total_students_count > 0) {
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
                    } else {
                        // Previous months before system go-live are clean empty
                        $branchData['months'][$m] = [
                            'month_name'     => $monthNames[$m],
                            'group'          => '-',
                            'private'        => '-',
                            'ielts'          => '-',
                            'toefl'          => '-',
                            'total_active'   => '-',
                            'inactive'       => '-',
                            'total_students' => '-',
                            'is_empty'       => true,
                        ];
                    }
                    continue;
                }

                // ── 2. Current Month: Live Calculation from Real DB Data ─────────
                $activeEnrollmentsQuery = \DB::table('lead_enrollments as le')
                    ->join('students as s', 'le.student_id', '=', 's.id')
                    ->join('leads as l', 's.lead_id', '=', 'l.id')
                    ->leftJoin('study_classes as sc', 'le.study_class_id', '=', 'sc.id')
                    ->leftJoin('price_masters as pm', 'sc.price_master_id', '=', 'pm.id')
                    ->where('l.branch_id', $branch->id)
                    ->where('s.status', 'active')
                    ->where('le.status', 'active');

                if ($modeFilter === 'online') {
                    $activeEnrollmentsQuery->where(function($q) {
                        $q->where('sc.type', 'online')
                          ->orWhere(fn($sq) => $sq->whereNull('sc.type')->where('l.is_online', 1));
                    });
                } elseif ($modeFilter === 'offline') {
                    $activeEnrollmentsQuery->where(function($q) {
                        $q->where(fn($sq) => $sq->whereNotNull('sc.type')->where('sc.type', '!=', 'online'))
                          ->orWhere(fn($sq) => $sq->whereNull('sc.type')->where(fn($ssq) => $ssq->where('l.is_online', 0)->orWhereNull('l.is_online')));
                    });
                }

                $activeEnrollments = $activeEnrollmentsQuery->select([
                    's.id as student_id',
                    'sc.name as class_name',
                    'sc.category as class_category',
                    'sc.type as delivery_type',
                    'pm.name as package_name',
                ])->get();

                $groupCount = 0;
                $privateCount = 0;
                $ieltsCount = 0;
                $toeflCount = 0;

                $uniqueStudentIds = [];

                foreach ($activeEnrollments as $enr) {
                    $uniqueStudentIds[$enr->student_id] = true;
                    $classNameUpper = strtoupper(($enr->class_name ?? '') . ' ' . ($enr->package_name ?? '') . ' ' . ($enr->class_category ?? ''));

                    if (str_contains($classNameUpper, 'IELTS')) {
                        $ieltsCount++;
                    } elseif (str_contains($classNameUpper, 'TOEFL')) {
                        $toeflCount++;
                    } elseif (str_contains($classNameUpper, 'GROUP') || str_contains($classNameUpper, '& CO') || str_contains($classNameUpper, '&CO')) {
                        $groupCount++;
                    } elseif (str_contains($classNameUpper, 'PRIVATE') || str_contains($classNameUpper, 'PRIVAT')) {
                        $privateCount++;
                    } else {
                        $groupCount++;
                    }
                }

                $totalActive = count($uniqueStudentIds);

                $inactiveQuery = Student::whereHas('lead', fn($q) => $q->where('branch_id', $branch->id))
                    ->where('status', 'stop')
                    ->whereYear('stopped_at', $year)
                    ->whereMonth('stopped_at', $m);

                if ($modeFilter === 'online') {
                    $inactiveQuery->whereHas('lead', fn($q) => $q->where('is_online', 1));
                } elseif ($modeFilter === 'offline') {
                    $inactiveQuery->whereHas('lead', fn($q) => $q->where('is_online', 0)->orWhereNull('is_online'));
                }

                $inactiveCount = $inactiveQuery->count();
                $totalStudents = $totalActive + $inactiveCount;

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

            // Calculate averages based on elapsed months count
            $divisor = max(1, $monthsCounted);
            foreach ($branchData['totals'] as $key => $sum) {
                $branchData['averages'][$key] = (int) round($sum / $divisor);
            }

            $matrixData[] = $branchData;
        }

        $headers = ['Month', 'Group', 'Private', 'IELTS', 'TOEFL', 'In Active', 'Total', 'Total Student Active'];

        return [
            $headers,
            $matrixData,
            "student-numbers-matrix-{$year}",
            "Student Numbers Campus {$year}",
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function buildStudentListExcelHtml(array $headers, array $rowsData): string
    {
        $activeRows = $rowsData['active'] ?? [];
        $stopRows   = $rowsData['stop'] ?? [];
        $filters    = $rowsData['filters'] ?? [];

        $html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        $html .= '<head><meta charset="UTF-8">';
        $html .= '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>';
        $html .= '<x:ExcelWorksheet><x:Name>Siswa Aktif</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>';
        $html .= '<x:ExcelWorksheet><x:Name>Siswa Stop</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>';
        $html .= '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
        $html .= '<style>';
        $html .= 'body { font-family: Arial, sans-serif; font-size: 11px; }';
        $html .= 'table { border-collapse: collapse; margin-bottom: 25px; width: 100%; }';
        $html .= 'th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11px; text-align: left; }';
        $html .= 'th.title-active { background-color: #059669; color: #ffffff; font-size: 14px; font-weight: bold; text-align: left; padding: 10px; border: 1px solid #047857; }';
        $html .= 'th.header-active { background-color: #10b981; color: #ffffff; font-weight: bold; }';
        $html .= 'th.title-stop { background-color: #be123c; color: #ffffff; font-size: 14px; font-weight: bold; text-align: left; padding: 10px; border: 1px solid #9f1239; }';
        $html .= 'th.header-stop { background-color: #f43f5e; color: #ffffff; font-weight: bold; }';
        $html .= 'tr:nth-child(even) td { background-color: #f8fafc; }';
        $html .= '.badge-active { color: #047857; font-weight: bold; }';
        $html .= '.badge-stop { color: #be123c; font-weight: bold; }';
        $html .= '.filter-box { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 12px; margin-bottom: 20px; font-size: 11px; }';
        $html .= '</style></head><body>';

        // ── INFORMASI FILTER ──────────────────────────────────────────────────
        $html .= '<table>';
        $html .= '<tr><th colspan="' . count($headers) . '" style="background-color: #1e293b; color: #ffffff; font-size: 11px; font-weight: bold;">INFORMASI LAPORAN</th></tr>';
        $html .= '<tr><td colspan="' . count($headers) . '" style="background-color: #f8fafc; padding: 10px;">';
        $html .= '<b>Tanggal Eksport:</b> ' . date('d M Y H:i') . '<br/>';
        if (empty($filters)) {
            $html .= '<b>FILTER:</b> SEMUA SISWA<br/>';
        } else {
            $html .= '<b>FILTER:</b> ';
            $filterStr = [];
            foreach ($filters as $key => $val) {
                $filterStr[] = "{$key}: <b>{$val}</b>";
            }
            $html .= implode(' | ', $filterStr) . '<br/>';
        }
        $html .= '</td></tr></table><br/>';

        // ── TABLE 1: SISWA AKTIF ──────────────────────────────────────────────
        $html .= '<table><thead>';
        $html .= '<tr><th colspan="' . count($headers) . '" class="title-active">DAFTAR SISWA AKTIF (' . count($activeRows) . ' Siswa)</th></tr>';
        $html .= '<tr>';
        foreach ($headers as $h) {
            $html .= '<th class="header-active">' . htmlspecialchars($h) . '</th>';
        }
        $html .= '</tr></thead><tbody>';

        if (empty($activeRows)) {
            $html .= '<tr><td colspan="' . count($headers) . '" style="text-align:center; padding: 15px; color:#94a3b8;">Tidak ada data siswa aktif</td></tr>';
        } else {
            foreach ($activeRows as $r) {
                $html .= '<tr>';
                $html .= '<td style="text-align:center;">' . $r['no'] . '</td>';
                $html .= '<td>' . htmlspecialchars($r['student_number']) . '</td>';
                $html .= '<td><b>' . htmlspecialchars($r['name']) . '</b></td>';
                $html .= '<td>' . htmlspecialchars($r['phone']) . '</td>';
                $html .= '<td>' . htmlspecialchars($r['branch']) . '</td>';
                $html .= '<td>' . htmlspecialchars($r['school']) . '</td>';
                $html .= '<td>' . htmlspecialchars($r['grade']) . '</td>';
                $html .= '<td>' . htmlspecialchars($r['address']) . '</td>';
                $html .= '<td>' . htmlspecialchars($r['class']) . '</td>';
                $html .= '<td>' . htmlspecialchars($r['start_join']) . '</td>';
                $html .= '<td class="badge-active">' . htmlspecialchars($r['status']) . '</td>';
                $html .= '</tr>';
            }
        }
        $html .= '</tbody></table><br/><br/>';

        // ── TABLE 2: SISWA STOP ───────────────────────────────────────────────
        $html .= '<table><thead>';
        $html .= '<tr><th colspan="' . count($headers) . '" class="title-stop">DAFTAR SISWA STOP / BERHENTI (' . count($stopRows) . ' Siswa)</th></tr>';
        $html .= '<tr>';
        foreach ($headers as $h) {
            $html .= '<th class="header-stop">' . htmlspecialchars($h) . '</th>';
        }
        $html .= '</tr></thead><tbody>';

        if (empty($stopRows)) {
            $html .= '<tr><td colspan="' . count($headers) . '" style="text-align:center; padding: 15px; color:#94a3b8;">Tidak ada data siswa stop</td></tr>';
        } else {
            foreach ($stopRows as $r) {
                $html .= '<tr>';
                $html .= '<td style="text-align:center;">' . $r['no'] . '</td>';
                $html .= '<td>' . htmlspecialchars($r['student_number']) . '</td>';
                $html .= '<td><b>' . htmlspecialchars($r['name']) . '</b></td>';
                $html .= '<td>' . htmlspecialchars($r['phone']) . '</td>';
                $html .= '<td>' . htmlspecialchars($r['branch']) . '</td>';
                $html .= '<td>' . htmlspecialchars($r['school']) . '</td>';
                $html .= '<td>' . htmlspecialchars($r['grade']) . '</td>';
                $html .= '<td>' . htmlspecialchars($r['address']) . '</td>';
                $html .= '<td>' . htmlspecialchars($r['class']) . '</td>';
                $html .= '<td>' . htmlspecialchars($r['start_join']) . '</td>';
                $html .= '<td class="badge-stop">' . htmlspecialchars($r['status']) . '</td>';
                $html .= '</tr>';
            }
        }
        $html .= '</tbody></table>';

        $html .= '</body></html>';
        return $html;
    }

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

    // ── Class Transfers ─────────────────────────────────────────────────────

    private function buildClassTransfers(Request $request): array
    {
        $year     = $request->input('year', now()->year);
        $month    = $request->input('month');
        $branchId = $request->input('branch_id');
        $isSqlite = \Illuminate\Support\Facades\DB::getDriverName() === 'sqlite';

        $query = \Illuminate\Support\Facades\DB::table('activity_log')
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
                \Illuminate\Support\Facades\DB::raw('COALESCE(superadmins.name, frontdesks.name, marketing.name, finance.name, teachers.name, users.email, "Admin") as causer_name'),
                'students.student_number',
                'leads.name as student_name',
                'leads.phone as student_phone',
                'leads.school as student_school',
                'leads.grade as student_grade',
                'branches.name as branch_name',
            ]);

        if ($branchId) {
            $query->where('leads.branch_id', $branchId);
        }

        if ($year) {
            if ($isSqlite) {
                $query->whereRaw("cast(strftime('%Y', activity_log.created_at) as integer) = ?", [$year]);
            } else {
                $query->whereYear('activity_log.created_at', $year);
            }
        }

        if ($month) {
            if ($isSqlite) {
                $query->whereRaw("cast(strftime('%m', activity_log.created_at) as integer) = ?", [$month]);
            } else {
                $query->whereMonth('activity_log.created_at', $month);
            }
        }

        $records = $query->orderBy('activity_log.created_at', 'desc')->get();

        $headers = [
            'No',
            'No. Siswa',
            'Nama Siswa',
            'Cabang',
            'No. HP',
            'Kelas Asal',
            'Kelas Tujuan Baru',
            'Tgl Efektif',
            'Alasan / Catatan',
            'Diproses Oleh',
            'Waktu Pencatatan',
        ];

        $rows = [];
        $no = 1;
        foreach ($records as $r) {
            $props = json_decode($r->properties ?? '{}', true) ?: [];
            $fromClassName = $props['from_class_name'] ?? '-';
            $toClassName = $props['to_class_name'] ?? '-';
            $reason = $props['reason'] ?? '-';
            $effectiveDate = $props['effective_date'] ?? null;

            if ($fromClassName === '-' && preg_match("/dipindahkan dari kelas '([^']+)' ke '([^']+)'/i", $r->description, $m)) {
                $fromClassName = $m[1] ?? '-';
                $toClassName = $m[2] ?? '-';
            }

            $rows[] = [
                $no++,
                $r->student_number ?? '-',
                $r->student_name,
                $r->branch_name ?? 'Central',
                $r->student_phone ?? '-',
                $fromClassName,
                $toClassName,
                $effectiveDate ? \Carbon\Carbon::parse($effectiveDate)->format('d/m/Y') : \Carbon\Carbon::parse($r->created_at)->format('d/m/Y'),
                $reason ?: '-',
                $r->causer_name ?? 'Admin',
                \Carbon\Carbon::parse($r->created_at)->format('d/m/Y H:i'),
            ];
        }

        $filename = "laporan_pindah_kelas_{$year}" . ($month ? "_{$month}" : '');
        $title    = "Laporan Riwayat Perpindahan Kelas Siswa — Tahun {$year}" . ($month ? " Bulan {$month}" : '');

        return [$headers, $rows, $filename, $title];
    }

    private function normalizeGradeCategory(?string $rawGrade): string
    {
        if (empty($rawGrade) || in_array(trim($rawGrade), ['-', '–', '—', 'none', 'null', 'Tidak Terdefinisi'])) {
            return 'Tidak Terdefinisi';
        }

        $upper = strtoupper(trim($rawGrade));

        if (str_contains($upper, 'TK') || str_contains($upper, 'PAUD') || str_contains($upper, 'PG') || str_contains($upper, 'PLAYGROUP') || str_contains($upper, 'KB') || str_contains($upper, 'KINDERGARTEN')) {
            return 'TK / PAUD';
        }

        if (str_contains($upper, 'SMA') || str_contains($upper, 'SMK') || str_contains($upper, 'SLTA') || str_contains($upper, 'SENIOR') || str_contains($upper, 'ALIYAH') || str_contains($upper, 'XI') || str_contains($upper, 'XII') || str_contains($upper, '10TH') || preg_match('/\b(SMA|SMK)\s*[1-3]/i', $upper)) {
            return 'SMA / SMK';
        }

        if (str_contains($upper, 'SMP') || str_contains($upper, 'JUNIOR') || str_contains($upper, 'MTS') || preg_match('/\bSMP\s*[1-3]/i', $upper)) {
            return 'SMP';
        }

        if (str_contains($upper, 'SD') || preg_match('/^(SD|D)\s*[1-6]/i', $upper) || str_contains($upper, 'PRIMARY') || str_contains($upper, 'ELEMENTARY')) {
            return 'SD';
        }

        if (str_contains($upper, 'MAHASISWA') || str_contains($upper, 'KULIAH') || str_contains($upper, 'UNIV') || str_contains($upper, 'KAMPUS') || str_contains($upper, 'COLLEGE')) {
            return 'Mahasiswa';
        }

        if (str_contains($upper, 'UMUM') || str_contains($upper, 'DEWASA') || str_contains($upper, 'KERJA') || str_contains($upper, 'KARYAWAN') || str_contains($upper, 'PROFESIONAL')) {
            return 'Umum';
        }

        return 'Umum';
    }
}
