<?php

namespace App\Domains\Academic\Application\Exports;

use App\Domains\Academic\Domain\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OverallAndGradesExport
{
    public function buildOverall(Request $request): array
    {
        $year  = (int) $request->input('year', now()->year);
        $month = $request->input('month') ? (int) $request->input('month') : null;

        $isSqlite   = DB::connection()->getDriverName() === 'sqlite';
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

    public function buildGrades(Request $request): array
    {
        $year  = (int) $request->input('year', now()->year);
        $month = $request->input('month') ? (int) $request->input('month') : null;

        $isSqlite = DB::connection()->getDriverName() === 'sqlite';

        $query = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->selectRaw("COALESCE(leads.grade, 'UMUM') as grade, count(*) as count")
            ->groupBy('grade');

        ExportFormatter::applyDateFilter($query, 'students.start_join', $year, $month, $isSqlite);

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
}
