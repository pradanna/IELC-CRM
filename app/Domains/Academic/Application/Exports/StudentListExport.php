<?php

namespace App\Domains\Academic\Application\Exports;

use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use Illuminate\Http\Request;

class StudentListExport
{
    public function build(Request $request): array
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
                            ->orWhere('grade', 'like', '%PG%')
                            ->orWhere('grade', 'like', '%KB%')
                            ->orWhere('school_level', 'like', '%TK%')
                            ->orWhere('school_level', 'like', '%PAUD%');
                    });
                } elseif ($gUpper === 'SD') {
                    $q->where(function ($sub) {
                        $sub->where('grade', 'like', 'SD%')
                            ->orWhere('grade', 'like', '% SD%')
                            ->orWhere('grade', 'like', 'D %')
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
                            ->orWhere('grade', 'like', 'Kelas 10%')
                            ->orWhere('grade', 'like', 'Kelas 11%')
                            ->orWhere('grade', 'like', 'Kelas 12%')
                            ->orWhere('grade', '10th')
                            ->orWhere('grade', 'XI')
                            ->orWhere('grade', 'XII')
                            ->orWhere('school_level', 'SMA')
                            ->orWhere('school_level', 'SMK');
                    });
                } elseif ($gUpper === 'UMUM') {
                    $q->where(function ($sub) {
                        $sub->where('grade', 'like', '%UMUM%')
                            ->orWhere('grade', 'like', '%KULIAH%')
                            ->orWhere('grade', 'like', '%KERJA%')
                            ->orWhere('grade', 'like', '%MAHASISWA%')
                            ->orWhere('grade', 'like', '%DEWASA%')
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

    public function toExcelHtml(array $headers, array $rowsData): string
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
}
