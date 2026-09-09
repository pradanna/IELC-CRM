<?php

namespace App\Domains\Academic\Application\Exports;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JoinLifecycleExport
{
    public function build(Request $request): array
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
            ? "CAST(strftime('%m', COALESCE(le.joined_at, s.start_join, s.created_at)) AS INTEGER)"
            : "MONTH(COALESCE(le.joined_at, s.start_join, s.created_at))";

        $yearExprLE = $isSqlite
            ? "CAST(strftime('%Y', COALESCE(le.joined_at, s.start_join, s.created_at)) AS INTEGER)"
            : "YEAR(COALESCE(le.joined_at, s.start_join, s.created_at))";

        $query = DB::table('lead_enrollments as le')
            ->join('study_classes as sc', 'le.study_class_id', '=', 'sc.id')
            ->join('price_masters as pm', 'sc.price_master_id', '=', 'pm.id')
            ->join('students as s', 'le.student_id', '=', 's.id')
            ->leftJoin('leads as l', 'le.lead_id', '=', 'l.id')
            ->leftJoin('invoices as inv', 'le.invoice_id', '=', 'inv.id')
            ->selectRaw("
                {$monthExpr} AS month_num,
                pm.name AS package_name,
                CASE 
                    WHEN sc.type = 'online' OR (sc.type IS NULL AND l.is_online = 1) THEN 'online'
                    ELSE 'offline'
                END AS delivery_mode,
                CASE 
                    WHEN inv.type = 'rejoin' OR (inv.type IS NULL AND s.rejoin_count > 0) THEN 'rejoin'
                    WHEN inv.type IN ('paket_lanjut', 'renewal', 'continue') OR (inv.type IS NULL AND le.cycle_number > 1) THEN 'paket_lanjut'
                    ELSE 'new_join'
                END AS lifecycle_type,
                COUNT(le.id) AS student_count
            ")
            ->whereNotNull(DB::raw("COALESCE(le.joined_at, s.start_join, s.created_at)"))
            ->whereRaw("{$yearExprLE} = ?", [$year]);

        if ($month) {
            $query->whereRaw("{$monthExpr} = ?", [$month]);
        }

        if ($modeFilter && in_array($modeFilter, ['online', 'offline'])) {
            if ($modeFilter === 'online') {
                $query->where(function($q) {
                    $q->where('sc.type', 'online')
                      ->orWhere(fn($sub) => $sub->whereNull('sc.type')->where('l.is_online', 1));
                });
            } else {
                $query->where(function($q) {
                    $q->where('sc.type', '!=', 'online')
                      ->orWhere(fn($sub) => $sub->whereNull('sc.type')->where(fn($sub2) => $sub2->where('l.is_online', 0)->orWhereNull('l.is_online')));
                });
            }
        }

        if ($branchId) {
            $query->where('l.branch_id', '=', $branchId);
        }

        $rawRows = $query
            ->groupByRaw("
                {$monthExpr}, 
                pm.name, 
                CASE WHEN sc.type = 'online' OR (sc.type IS NULL AND l.is_online = 1) THEN 'online' ELSE 'offline' END,
                CASE WHEN inv.type = 'rejoin' OR (inv.type IS NULL AND s.rejoin_count > 0) THEN 'rejoin' WHEN inv.type IN ('paket_lanjut', 'renewal', 'continue') OR (inv.type IS NULL AND le.cycle_number > 1) THEN 'paket_lanjut' ELSE 'new_join' END
            ")
            ->get();

        $allPackages = $rawRows->pluck('package_name')->unique()->sort()->values()->toArray();
        if (empty($allPackages)) {
            $allPackages = DB::table('price_masters')->orderBy('name')->pluck('name')->toArray();
        }

        $pivotByMonthPkg = [];
        $totals = [
            'new_join'     => 0,
            'paket_lanjut' => 0,
            'rejoin'       => 0,
            'total'        => 0,
            'by_package'   => [],
        ];

        foreach ($allPackages as $pkg) {
            $totals['by_package'][$pkg] = [
                'new_join'     => 0,
                'paket_lanjut' => 0,
                'rejoin'       => 0,
                'total'        => 0,
            ];
        }

        foreach ($rawRows as $r) {
            $mNum = (int) $r->month_num;
            $pkg  = $r->package_name;
            $type = $r->lifecycle_type;
            $cnt  = (int) $r->student_count;

            if (!isset($pivotByMonthPkg[$mNum])) {
                $pivotByMonthPkg[$mNum] = [];
            }
            if (!isset($pivotByMonthPkg[$mNum][$pkg])) {
                $pivotByMonthPkg[$mNum][$pkg] = ['new_join' => 0, 'paket_lanjut' => 0, 'rejoin' => 0, 'total' => 0];
            }

            $pivotByMonthPkg[$mNum][$pkg][$type] += $cnt;
            $pivotByMonthPkg[$mNum][$pkg]['total'] += $cnt;

            $totals[$type] += $cnt;
            $totals['total'] += $cnt;

            if (isset($totals['by_package'][$pkg])) {
                $totals['by_package'][$pkg][$type] += $cnt;
                $totals['by_package'][$pkg]['total'] += $cnt;
            }
        }

        $monthLabels = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'Sept', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec',
        ];

        $pivotMonths = [];
        foreach ($monthLabels as $num => $label) {
            $pkgData = [];
            $mNew = 0;
            $mLanjut = 0;
            $mRejoin = 0;

            foreach ($allPackages as $pkg) {
                $pCounts = $pivotByMonthPkg[$num][$pkg] ?? ['new_join' => 0, 'paket_lanjut' => 0, 'rejoin' => 0, 'total' => 0];
                $pkgData[$pkg] = $pCounts;
                $mNew    += $pCounts['new_join'];
                $mLanjut += $pCounts['paket_lanjut'];
                $mRejoin += $pCounts['rejoin'];
            }

            $pivotMonths[] = [
                'month'        => $num,
                'label'        => $label,
                'new_join'     => $mNew,
                'paket_lanjut' => $mLanjut,
                'rejoin'       => $mRejoin,
                'total'        => $mNew + $mLanjut + $mRejoin,
                'packages'     => $pkgData,
            ];
        }

        if ($month) {
            $pivotMonths = array_values(array_filter($pivotMonths, fn($m) => $m['month'] === $month));
        }

        return [
            'title'          => "Laporan Siklus Join Siswa {$year}" . ($branchName ? " ({$branchName})" : '') . ($month ? " Bulan {$month}" : ''),
            'filename'       => "siklus-join-siswa-{$year}" . ($branchId ? "-branch{$branchId}" : '') . ($month ? "-bulan{$month}" : ''),
            'year'           => $year,
            'month'          => $month,
            'modeFilter'     => $modeFilter,
            'branchName'     => $branchName,
            'packageList'    => $allPackages,
            'months'         => $pivotMonths,
            'totals'         => $totals,
        ];
    }
}
