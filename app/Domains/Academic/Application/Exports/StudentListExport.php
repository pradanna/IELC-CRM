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

        $statusFilter = $request->input('status');

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

        if ($statusFilter === 'stop') {
            $appliedFilters['Status Siswa'] = 'STOP (BERHENTI)';
            $activeRows = [];
            $stopRows   = (clone $query)->where('status', 'stop')->orderBy('created_at', 'desc')->get()->map($mapRow)->toArray();
        } else {
            // When status is 'active', 'all', or default:
            // Fetch active students for Tab 1 (Siswa Aktif)
            $activeRows = (clone $query)->where('status', '!=', 'stop')->orderBy('created_at', 'desc')->get()->map($mapRow)->toArray();

            // Fetch stopped students for Tab 2 (Siswa Stop) applying all other active filters (branch, grade, class, search, etc.)
            $stopQuery = Student::with(['lead.branch', 'studyClasses'])->select('students.*');

            if ($request->filled('loyalty_tier')) {
                $tier = $request->loyalty_tier;
                if ($tier === 'none') {
                    $stopQuery->where(function ($q) {
                        $q->whereNull('loyalty_tier')->orWhere('loyalty_tier', '');
                    });
                } else {
                    $stopQuery->where('loyalty_tier', $tier);
                }
            }

            if ($request->filled('search')) {
                $s = $request->search;
                $stopQuery->where(function ($q) use ($s) {
                    $q->whereHas('lead', fn ($lq) =>
                        $lq->where('name', 'like', "%{$s}%")->orWhere('phone', 'like', "%{$s}%")
                    )->orWhere('student_number', 'like', "%{$s}%");
                });
            }

            if ($request->filled('class_category')) {
                $cat = strtolower($request->class_category);
                $stopQuery->whereHas('studyClasses', fn ($q) => $q->where('category', $cat));
            }

            if ($request->filled('study_class_id')) {
                $stopQuery->whereHas('studyClasses', fn ($q) =>
                    $q->where('study_classes.id', $request->study_class_id)
                );
            }

            if ($request->filled('grade')) {
                $g = trim($request->grade);
                $gUpper = strtoupper($g);
                $stopQuery->whereHas('lead', function ($q) use ($g, $gUpper) {
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
                $stopQuery->whereHas('lead', fn ($q) => $q->where('branch_id', $request->branch_id));
            }

            $stopRows = $stopQuery->where('status', 'stop')->orderBy('created_at', 'desc')->get()->map($mapRow)->toArray();
        }

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

        $xmlEscape = function ($val): string {
            return htmlspecialchars((string) $val, ENT_XML1 | ENT_QUOTES, 'UTF-8');
        };

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<?mso-application progid="Excel.Sheet"?>' . "\n";
        $xml .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"' . "\n";
        $xml .= ' xmlns:o="urn:schemas-microsoft-com:office:office"' . "\n";
        $xml .= ' xmlns:x="urn:schemas-microsoft-com:office:excel"' . "\n";
        $xml .= ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"' . "\n";
        $xml .= ' xmlns:html="http://www.w3.org/TR/REC-html40">' . "\n";

        // Styles
        $xml .= ' <Styles>' . "\n";
        $xml .= '  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/></Style>' . "\n";
        $xml .= '  <Style ss:ID="HeaderActive"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/></Borders><Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/><Interior ss:Color="#059669" ss:Pattern="Solid"/></Style>' . "\n";
        $xml .= '  <Style ss:ID="HeaderStop"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#9F1239"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#9F1239"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#9F1239"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#9F1239"/></Borders><Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/><Interior ss:Color="#BE123C" ss:Pattern="Solid"/></Style>' . "\n";
        $xml .= '  <Style ss:ID="TitleActive"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:FontName="Segoe UI" ss:Size="12" ss:Color="#047857" ss:Bold="1"/></Style>' . "\n";
        $xml .= '  <Style ss:ID="TitleStop"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:FontName="Segoe UI" ss:Size="12" ss:Color="#BE123C" ss:Bold="1"/></Style>' . "\n";
        $xml .= '  <Style ss:ID="FilterInfo"><Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#64748B" ss:Italic="1"/></Style>' . "\n";
        $xml .= '  <Style ss:ID="CellData"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders><Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#1E293B"/></Style>' . "\n";
        $xml .= '  <Style ss:ID="CellCenter"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders><Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#1E293B"/></Style>' . "\n";
        $xml .= '  <Style ss:ID="CellBold"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders><Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#0F172A" ss:Bold="1"/></Style>' . "\n";
        $xml .= '  <Style ss:ID="CellActive"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders><Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#047857" ss:Bold="1"/></Style>' . "\n";
        $xml .= '  <Style ss:ID="CellStop"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders><Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#BE123C" ss:Bold="1"/></Style>' . "\n";
        $xml .= ' </Styles>' . "\n";

        $renderSheet = function (string $sheetName, string $titleText, string $titleStyle, string $headerStyle, string $statusStyle, array $rows) use ($headers, $filters, $xmlEscape): string {
            $out = " <Worksheet ss:Name=\"{$sheetName}\">\n";
            $out .= "  <Table>\n";
            $widths = [35, 85, 160, 105, 90, 120, 85, 170, 120, 85, 65];
            foreach ($widths as $w) {
                $out .= "   <Column ss:Width=\"{$w}\"/>\n";
            }

            // Title Row
            $out .= "   <Row ss:Height=\"24\"><Cell ss:StyleID=\"{$titleStyle}\"><Data ss:Type=\"String\">" . $xmlEscape($titleText) . "</Data></Cell></Row>\n";

            // Filter Information Row
            $filterDesc = empty($filters) ? 'Filter: SEMUA SISWA' : 'Filter: ' . implode(' | ', array_map(fn($k, $v) => "{$k}: {$v}", array_keys($filters), array_values($filters)));
            $filterDesc .= ' | Tanggal Export: ' . date('d M Y H:i');
            $out .= "   <Row ss:Height=\"18\"><Cell ss:StyleID=\"FilterInfo\"><Data ss:Type=\"String\">" . $xmlEscape($filterDesc) . "</Data></Cell></Row>\n";
            $out .= "   <Row ss:Height=\"8\"></Row>\n";

            // Header Row
            $out .= "   <Row ss:Height=\"22\">\n";
            foreach ($headers as $h) {
                $out .= "    <Cell ss:StyleID=\"{$headerStyle}\"><Data ss:Type=\"String\">" . $xmlEscape($h) . "</Data></Cell>\n";
            }
            $out .= "   </Row>\n";

            // Data Rows
            if (empty($rows)) {
                $out .= "   <Row ss:Height=\"22\"><Cell ss:StyleID=\"CellCenter\"><Data ss:Type=\"String\">Tidak ada data</Data></Cell></Row>\n";
            } else {
                foreach ($rows as $r) {
                    $out .= "   <Row ss:Height=\"19\">\n";
                    $out .= "    <Cell ss:StyleID=\"CellCenter\"><Data ss:Type=\"Number\">" . (int) $r['no'] . "</Data></Cell>\n";
                    $out .= "    <Cell ss:StyleID=\"CellData\"><Data ss:Type=\"String\">" . $xmlEscape($r['student_number']) . "</Data></Cell>\n";
                    $out .= "    <Cell ss:StyleID=\"CellBold\"><Data ss:Type=\"String\">" . $xmlEscape($r['name']) . "</Data></Cell>\n";
                    $out .= "    <Cell ss:StyleID=\"CellData\"><Data ss:Type=\"String\">" . $xmlEscape($r['phone']) . "</Data></Cell>\n";
                    $out .= "    <Cell ss:StyleID=\"CellData\"><Data ss:Type=\"String\">" . $xmlEscape($r['branch']) . "</Data></Cell>\n";
                    $out .= "    <Cell ss:StyleID=\"CellData\"><Data ss:Type=\"String\">" . $xmlEscape($r['school']) . "</Data></Cell>\n";
                    $out .= "    <Cell ss:StyleID=\"CellData\"><Data ss:Type=\"String\">" . $xmlEscape($r['grade']) . "</Data></Cell>\n";
                    $out .= "    <Cell ss:StyleID=\"CellData\"><Data ss:Type=\"String\">" . $xmlEscape($r['address']) . "</Data></Cell>\n";
                    $out .= "    <Cell ss:StyleID=\"CellData\"><Data ss:Type=\"String\">" . $xmlEscape($r['class']) . "</Data></Cell>\n";
                    $out .= "    <Cell ss:StyleID=\"CellCenter\"><Data ss:Type=\"String\">" . $xmlEscape($r['start_join']) . "</Data></Cell>\n";
                    $out .= "    <Cell ss:StyleID=\"{$statusStyle}\"><Data ss:Type=\"String\">" . $xmlEscape($r['status']) . "</Data></Cell>\n";
                    $out .= "   </Row>\n";
                }
            }

            $out .= "  </Table>\n";
            $out .= " </Worksheet>\n";
            return $out;
        };

        $xml .= $renderSheet('Siswa Aktif', 'DAFTAR SISWA AKTIF (' . count($activeRows) . ' Siswa)', 'TitleActive', 'HeaderActive', 'CellActive', $activeRows);
        $xml .= $renderSheet('Siswa Stop', 'DAFTAR SISWA STOP / BERHENTI (' . count($stopRows) . ' Siswa)', 'TitleStop', 'HeaderStop', 'CellStop', $stopRows);

        $xml .= '</Workbook>' . "\n";
        return $xml;
    }
}
