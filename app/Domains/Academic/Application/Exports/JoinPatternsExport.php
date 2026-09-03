<?php

namespace App\Domains\Academic\Application\Exports;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JoinPatternsExport
{
    public function build(Request $request): array
    {
        $year  = (int) $request->input('year', now()->year);
        $month = $request->input('month') ? (int) $request->input('month') : null;

        $isSqlite   = DB::connection()->getDriverName() === 'sqlite';
        $dateFormat = $isSqlite
            ? "strftime('%Y-%m', le.joined_at)"
            : "DATE_FORMAT(le.joined_at, '%Y-%m')";

        $query = DB::table('lead_enrollments as le')
            ->join('study_classes as sc', 'le.study_class_id', '=', 'sc.id')
            ->join('price_masters as pm', 'sc.price_master_id', '=', 'pm.id')
            ->selectRaw("{$dateFormat} as month, pm.name as package_name, sc.type as delivery_type, count(*) as count")
            ->groupBy('month', 'package_name', 'delivery_type')
            ->orderBy('month', 'asc');

        ExportFormatter::applyDateFilter($query, 'le.joined_at', $year, $month, $isSqlite);

        $data = $query->get();

        $headers = ['Bulan', 'Paket Belajar', 'Tipe Kelas', 'Jumlah Siswa'];
        $rows    = $data->map(fn ($r) => [
            $r->month ?? '-',
            $r->package_name ?? '-',
            $r->delivery_type === 'online' ? 'Online' : 'On Campus',
            (int) $r->count,
        ])->toArray();

        return [
            $headers,
            $rows,
            "pola-join-{$year}" . ($month ? "-bulan{$month}" : ''),
            "Pola Join Siswa {$year}",
        ];
    }

    public function buildPivot(Request $request): array
    {
        $year       = (int) $request->input('year', now()->year);
        $month      = $request->input('month') ? (int) $request->input('month') : null;
        $modeFilter = $request->input('mode');
        $branchId   = $request->input('branch_id') ?: null;

        $branchName = null;
        if ($branchId) {
            $branchName = DB::table('branches')->where('id', $branchId)->value('name');
        }

        $isSqlite = DB::connection()->getDriverName() === 'sqlite';

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

        // Siswa Out (Stopped Students) per month & mode
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

        $stoppedTotals = ['online' => 0, 'offline' => 0];
        $stoppedMap = [];
        foreach ($rawStoppedRows as $sr) {
            $sm = (int) $sr->month_num;
            $sOn = (int) $sr->online_count;
            $sOff = (int) $sr->offline_count;
            $stoppedMap[$sm] = ['online' => $sOn, 'offline' => $sOff];
            $stoppedTotals['online']  += $sOn;
            $stoppedTotals['offline'] += $sOff;
        }

        // Attach stopped data to each pivot month
        foreach ($pivotMonths as &$pmItem) {
            $mNum = $pmItem['month'];
            $pmItem['stopped'] = $stoppedMap[$mNum] ?? ['online' => 0, 'offline' => 0];
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

    public function buildInvoices(Request $request): array
    {
        $year       = (int) $request->input('year', now()->year);
        $month      = $request->input('month') ? (int) $request->input('month') : null;
        $modeFilter = $request->input('mode');
        $branchId   = $request->input('branch_id') ?: null;

        $branchName = null;
        if ($branchId) {
            $branchName = DB::table('branches')->where('id', $branchId)->value('name');
        }

        $isSqlite = DB::connection()->getDriverName() === 'sqlite';

        $monthExpr = $isSqlite
            ? "CAST(strftime('%m', le.joined_at) AS INTEGER)"
            : "MONTH(le.joined_at)";

        $yearExprLE = $isSqlite
            ? "CAST(strftime('%Y', le.joined_at) AS INTEGER)"
            : "YEAR(le.joined_at)";

        $query = DB::table('lead_enrollments as le')
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

    public function buildGrades(Request $request): array
    {
        $year       = (int) $request->input('year', now()->year);
        $month      = $request->input('month') ? (int) $request->input('month') : null;
        $modeFilter = $request->input('mode');
        $branchId   = $request->input('branch_id') ?: null;

        $branchName = null;
        if ($branchId) {
            $branchName = DB::table('branches')->where('id', $branchId)->value('name');
        }

        $isSqlite = DB::connection()->getDriverName() === 'sqlite';

        $monthExpr = $isSqlite
            ? "CAST(strftime('%m', le.joined_at) AS INTEGER)"
            : "MONTH(le.joined_at)";

        $yearExprLE = $isSqlite
            ? "CAST(strftime('%Y', le.joined_at) AS INTEGER)"
            : "YEAR(le.joined_at)";

        $query = DB::table('lead_enrollments as le')
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
            $grade = ExportFormatter::normalizeGradeCategory($r->grade_name);
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
}
