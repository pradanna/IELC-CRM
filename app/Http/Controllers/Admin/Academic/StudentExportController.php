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
        $tab = $request->input('tab', 'list');

        if ($tab === 'join_patterns') {
            $pivotData = $this->buildJoinPatternsPivot($request);
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.join-pattern-export', $pivotData)
                ->setPaper('a4', 'landscape');
            return $pdf->download("{$pivotData['filename']}.pdf");
        }

        if ($tab === 'join_invoices') {
            $invoiceData = $this->buildJoinInvoicesData($request);
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.join-invoices-export', $invoiceData)
                ->setPaper('a4', 'landscape');
            return $pdf->download("{$invoiceData['filename']}.pdf");
        }

        if ($tab === 'join_grades') {
            $gradeData = $this->buildJoinGradesData($request);
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.join-grades-export', $gradeData)
                ->setPaper('a4', 'landscape');
            return $pdf->download("{$gradeData['filename']}.pdf");
        }

        if (in_array($tab, ['siswa_stop_packages', 'siswa_stop_programs', 'siswa_stop_grades'])) {
            $groupType = str_replace('siswa_stop_', '', $tab);
            $stopData = $this->buildSiswaStopPivotData($request, $groupType);
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.siswa-stop-export', $stopData)
                ->setPaper('a4', 'landscape');
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
            ])->setPaper('a4', 'landscape');

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
        ])->setPaper('a4', 'landscape');

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
            'siswa_stop'    => $this->buildSiswaStop($request),
            'grades'        => $this->buildGrades($request),
            default         => $this->buildStudentList($request),
        };
    }

    // ── List ─────────────────────────────────────────────────────────────────

    private function buildStudentList(Request $request): array
    {
        $query = Student::with(['lead.branch', 'studyClasses'])
            ->select('students.*');

        $appliedFilters = [];

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
            $g = $request->grade;
            $appliedFilters['Tingkat Sekolah'] = $g;
            $query->whereHas('lead', fn ($q) => $q->where('grade', $g));
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

        if ($request->filled('status')) {
            $appliedFilters['Status Siswa'] = strtoupper($request->status);
            $query->where('status', $request->status);
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

        $defaultGrades = ['TK / Paud', 'SD', 'SMP', 'SMA / SMK', 'Kuliah', 'Umum', 'Tidak Terdefinisi'];
        $dbGrades = $rawRows->pluck('grade_name')->unique()->toArray();
        $allGrades = array_values(array_unique(array_merge($defaultGrades, $dbGrades)));

        $pivotOffline  = [];
        $pivotOnline   = [];
        $totalsOffline = array_fill_keys($allGrades, 0);
        $totalsOnline  = array_fill_keys($allGrades, 0);

        foreach ($rawRows as $r) {
            $mNum  = (int) $r->month_num;
            $grade = $r->grade_name;
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
            $defaultCols = ['TK / Paud', 'SD', 'SMP', 'SMA / SMK', 'Kuliah', 'Umum', 'Tidak Terdefinisi'];
        }

        $query->selectRaw("
            {$monthExpr} AS month_num,
            {$colExpr}   AS col_name,
            sc.type      AS delivery_mode,
            COUNT(DISTINCT s.id) AS stop_count
        ")->groupByRaw("{$monthExpr}, {$colExpr}, sc.type");

        $rawRows = $query->get();

        $dbCols = $rawRows->pluck('col_name')->filter()->unique()->toArray();
        $allCols = array_values(array_unique(array_merge($defaultCols, $dbCols)));

        $pivotOffline  = [];
        $pivotOnline   = [];
        $totalsOffline = array_fill_keys($allCols, 0);
        $totalsOnline  = array_fill_keys($allCols, 0);

        foreach ($rawRows as $r) {
            $mNum = (int) $r->month_num;
            $col  = $r->col_name ?: 'Umum';
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
                    ->with(['studyClasses.priceMaster', 'lead.leadType'])
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

                    $priceMasterNames = $student->studyClasses->pluck('priceMaster.name')->filter();
                    $classNames = $student->studyClasses->pluck('name')->merge(
                        $student->studyClasses->pluck('category')
                    )->merge($priceMasterNames)->merge([$student->lead?->leadType?->name])->filter()->implode(' ');

                    $upperNames = strtoupper($classNames);

                    if (str_contains($upperNames, 'IELTS')) {
                        $ieltsCount++;
                    } elseif (str_contains($upperNames, 'TOEFL')) {
                        $toeflCount++;
                    } elseif (str_contains($upperNames, 'PRIVATE') || str_contains($upperNames, '& CO') || str_contains($upperNames, 'PRIVAT')) {
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
