<?php

namespace App\Domains\Academic\Application\Exports;

use App\Domains\Academic\Domain\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClassTransfersExport
{
    public function build(Request $request): array
    {
        $year     = $request->input('year', now()->year);
        $month    = $request->input('month');
        $branchId = $request->input('branch_id');
        $isSqlite = DB::getDriverName() === 'sqlite';

        $query = DB::table('activity_log')
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
                $effectiveDate ? Carbon::parse($effectiveDate)->format('d/m/Y') : Carbon::parse($r->created_at)->format('d/m/Y'),
                $reason ?: '-',
                $r->causer_name ?? 'Admin',
                Carbon::parse($r->created_at)->format('d/m/Y H:i'),
            ];
        }

        $filename = "laporan_pindah_kelas_{$year}" . ($month ? "_{$month}" : '');
        $title    = "Laporan Riwayat Perpindahan Kelas Siswa — Tahun {$year}" . ($month ? " Bulan {$month}" : '');

        return [$headers, $rows, $filename, $title];
    }
}
