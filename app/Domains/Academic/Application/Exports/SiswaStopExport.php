<?php

namespace App\Domains\Academic\Application\Exports;

use App\Domains\Academic\Domain\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SiswaStopExport
{
    public function build(Request $request): array
    {
        $year = (int) $request->input('year', now()->year);

        $isSqlite   = DB::connection()->getDriverName() === 'sqlite';
        $dateFormat = $isSqlite
            ? "strftime('%Y-%m', stopped_at)"
            : "DATE_FORMAT(stopped_at, '%Y-%m')";

        $query = Student::where('status', 'stop')
            ->whereNotNull('stopped_at')
            ->selectRaw("{$dateFormat} as month, count(*) as count")
            ->groupBy('month')
            ->orderBy('month', 'asc');

        ExportFormatter::applyDateFilter($query, 'stopped_at', $year, null, $isSqlite);

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

    public function buildPivot(Request $request, string $groupByType): array
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
            ? "CAST(strftime('%m', s.stopped_at) AS INTEGER)"
            : "MONTH(s.stopped_at)";

        $yearExprStop = $isSqlite
            ? "CAST(strftime('%Y', s.stopped_at) AS INTEGER)"
            : "YEAR(s.stopped_at)";

        $query = DB::table('students as s')
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
        $dbPriceMasters = DB::table('price_masters')->orderBy('name')->pluck('name')->toArray();
        $defaultCols = array_values(array_unique(array_merge($dbPriceMasters, ['Tidak Terdefinisi'])));

        if ($groupByType === 'programs') {
            $colExpr = "COALESCE(NULLIF(sc.category, ''), COALESCE(NULLIF(lt.name, ''), 'Tidak Terdefinisi'))";
            $subTitle = "Based on Program / Lead Type";
            $dbLeadTypes = DB::table('lead_types')->orderBy('name')->pluck('name')->toArray();
            $dbClassCategories = DB::table('study_classes')->whereNotNull('category')->where('category', '!=', '')->pluck('category')->toArray();
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
            $col  = $groupByType === 'grades' ? ExportFormatter::normalizeGradeCategory($r->col_name) : ($r->col_name ?: 'Tidak Terdefinisi');
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
}
