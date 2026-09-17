<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Nilai Placement Test - {{ $candidate_name }}</title>
    <style>
        @page {
            margin: 12mm 15mm 15mm 15mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0f172a;
            font-size: 11px;
            line-height: 1.4;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .logo-cell {
            vertical-align: middle;
            width: 50%;
        }
        .branch-cell {
            text-align: right;
            vertical-align: middle;
            font-size: 10px;
            color: #64748b;
        }
        .brand-title {
            font-size: 26px;
            font-weight: 900;
            color: #000000;
            letter-spacing: 0.5px;
            line-height: 1;
        }
        .report-title-banner {
            text-align: center;
            margin-bottom: 16px;
        }
        .report-title-banner h1 {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 2px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .report-title-banner p {
            font-size: 10px;
            color: #64748b;
            margin: 0;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Candidate info grid */
        .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 16px;
            margin-bottom: 16px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .info-table td {
            padding: 4px 0;
            vertical-align: middle;
            font-size: 10.5px;
        }
        .info-label {
            color: #64748b;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8.5px;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }
        .info-colon {
            color: #64748b;
            font-weight: bold;
            font-size: 9px;
            text-align: center;
        }
        .info-val {
            color: #0f172a;
            font-weight: 600;
        }

        /* Separated Metric Boxes */
        .metrics-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 16px;
        }
        .metric-box {
            background-color: #f0fdf4;
            border: 1.5px solid #86efac;
            border-radius: 8px;
            padding: 8px 10px;
            text-align: center;
        }
        .metric-val {
            font-size: 18px;
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 2px;
        }
        .metric-label {
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
        }

        /* Breakdown Table */
        .section-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: #0f172a;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            border-left: 3px solid #0f172a;
            padding-left: 8px;
        }
        .breakdown-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-bottom: 15px;
        }
        .breakdown-table th {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 5px 6px;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 8.5px;
            color: #334155;
            text-align: center;
        }
        .breakdown-table td {
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            vertical-align: middle;
        }
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }

        .status-pill {
            display: inline-block;
            padding: 1px 6px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 8.5px;
        }
        .status-perfect {
            background-color: #dcfce7;
            color: #15803d;
        }
        .status-partial {
            background-color: #fef3c7;
            color: #b45309;
        }
        .status-wrong {
            background-color: #fee2e2;
            color: #b91c1c;
        }

        .notes-box {
            background-color: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 15px;
            font-size: 10px;
        }
        .notes-title {
            font-weight: bold;
            color: #92400e;
            font-size: 9px;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        /* Sign-off */
        .footer-table {
            width: 100%;
            margin-top: 20px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
        .footer-note {
            font-size: 8.5px;
            color: #94a3b8;
            line-height: 1.4;
        }
        .sign-box {
            text-align: right;
            font-size: 9.5px;
            color: #475569;
        }
        .sign-line {
            display: inline-block;
            border-top: 1px solid #475569;
            width: 140px;
            margin-top: 35px;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <table class="header-table">
        <tr>
            <td class="logo-cell">
                <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('assets/images/local/logo-full.png'))) }}" style="max-height: 44px; width: auto;" alt="IELC Logo">
            </td>
            <td class="branch-cell">
                <div style="font-weight: bold; color: #0f172a;">{{ $branch_name }}</div>
                <div>Official Placement Test Assessment</div>
                <div>Laporan Resmi Evaluasi Hasil Tes</div>
            </td>
        </tr>
    </table>

    <!-- Banner -->
    <div class="report-title-banner">
        <h1>Laporan Nilai Placement Test</h1>
        <p>Placement Test Score Report</p>
    </div>

    <!-- Candidate Info -->
    <div class="info-card">
        <table class="info-table">
            <tr>
                <td class="info-label" style="width: 13%;">Nama Siswa</td>
                <td class="info-colon" style="width: 2%;">:</td>
                <td class="info-val" style="width: 35%; font-size: 11px; font-weight: bold; color: #0f172a; padding-right: 12px;">
                    {{ $candidate_name }}
                </td>
                <td class="info-label" style="width: 13%;">Tanggal Tes</td>
                <td class="info-colon" style="width: 2%;">:</td>
                <td class="info-val" style="width: 35%;">
                    {{ $test_date }}
                </td>
            </tr>
            <tr>
                <td class="info-label">Program Tes</td>
                <td class="info-colon">:</td>
                <td class="info-val" colspan="4">
                    {{ $exam->title }} <span style="color: #64748b; font-size: 9.5px; font-weight: normal;">({{ $category }})</span>
                </td>
            </tr>
        </table>
    </div>

    <!-- Separated Metric Boxes -->
    <table class="metrics-table">
        <tr>
            <td style="width: 32%;">
                <div class="metric-box">
                    <div class="metric-val" style="color: #16a34a;">{{ $correct_targets }}</div>
                    <div class="metric-label">{{ $unit_label }} Benar</div>
                </div>
            </td>
            <td style="width: 2%;"></td>
            <td style="width: 32%;">
                <div class="metric-box">
                    <div class="metric-val" style="color: #475569;">{{ $total_targets }}</div>
                    <div class="metric-label">Total {{ $unit_label }}</div>
                </div>
            </td>
            <td style="width: 2%;"></td>
            <td style="width: 32%;">
                <div class="metric-box">
                    <div class="metric-val" style="color: #0284c7;">{{ $percentage !== null ? $percentage . '%' : '-' }}</div>
                    <div class="metric-label">Skor Akhir</div>
                </div>
            </td>
        </tr>
    </table>

    @if(!empty($grading_notes))
        <div class="notes-box">
            <div class="notes-title">Catatan Penguji / Evaluator:</div>
            <div>{{ $grading_notes }}</div>
        </div>
    @endif

    <!-- Breakdown Table for Kids & General -->
    @if(count($questions) > 0)
        <div class="section-title">Rincian Performa Per Soal (Question Breakdown)</div>
        <table class="breakdown-table">
            <thead>
                <tr>
                    <th style="width: 30px;">No</th>
                    <th class="text-left">Instruksi / Bagian Soal</th>
                    <th style="width: 80px;">Jumlah Isian</th>
                    <th style="width: 70px;">Isian Benar</th>
                    <th style="width: 60px;">Akurasi</th>
                    <th style="width: 90px;">Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($questions as $q)
                    @php
                        $qPct = $q['total_targets'] > 0 ? round(($q['correct_targets'] / $q['total_targets']) * 100) : 0;
                    @endphp
                    <tr>
                        <td class="text-center font-bold">{{ $q['number'] }}</td>
                        <td class="text-left">
                            <div style="font-weight: bold; color: #1e293b;">{{ \Illuminate\Support\Str::limit($q['instruction'], 75) }}</div>
                        </td>
                        <td class="text-center">{{ $q['total_targets'] }} {{ $unit_label }}</td>
                        <td class="text-center font-bold" style="color: {{ $q['correct_targets'] === $q['total_targets'] ? '#16a34a' : ($q['correct_targets'] > 0 ? '#d97706' : '#dc2626') }};">
                            {{ $q['correct_targets'] }}
                        </td>
                        <td class="text-center font-bold">{{ $qPct }}%</td>
                        <td class="text-center">
                            @if($q['is_perfect'])
                                <span class="status-pill status-perfect">Sempurna</span>
                            @elseif($q['correct_targets'] > 0)
                                <span class="status-pill status-partial">Sebagian Benar</span>
                            @else
                                <span class="status-pill status-wrong">{{ in_array(($category ?? ''), ['General', 'IELTS']) || ($q['total_targets'] ?? 0) === 1 ? 'Kurang Tepat' : 'Perlu Belajar' }}</span>
                            @endif
                        </td>
                    </tr>
                @endforeach
                <tr style="background-color: #f8fafc; font-weight: bold;">
                    <td colspan="2" class="text-right" style="padding-right: 12px; text-transform: uppercase;">Total Keseluruhan:</td>
                    <td class="text-center">{{ $total_targets }} {{ $unit_label }}</td>
                    <td class="text-center" style="color: #16a34a; font-size: 11px;">{{ $correct_targets }}</td>
                    <td class="text-center" style="color: #0284c7; font-size: 11px;">{{ $percentage }}%</td>
                    <td class="text-center">
                        <span class="status-pill {{ $percentage >= 80 ? 'status-perfect' : ($percentage >= 50 ? 'status-partial' : 'status-wrong') }}">
                            {{ $percentage >= 80 ? 'Sangat Baik' : ($percentage >= 50 ? 'Cukup Baik' : 'Perlu Bimbingan') }}
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
    @endif

    <!-- Footer / Signatures -->
    <table class="footer-table">
        <tr>
            <td style="vertical-align: top; width: 60%;">
                <div class="footer-note">
                    <strong>Catatan Akademik:</strong><br>
                    Laporan ini digenerate secara otomatis oleh sistem akademik IELC berdasarkan hasil pengisian placement test siswa.<br>
                    Rekomendasi kelas ditujukan untuk memastikan siswa belajar di tingkatan yang paling optimal sesuai kemampuannya.
                </div>
            </td>
            <td class="sign-box" style="vertical-align: top; width: 40%;">
                <div>Dicetak pada: {{ now()->translatedFormat('d F Y, H:i') }}</div>
                <div>Academic Consultant / Assessor</div>
                <div class="sign-line"></div>
                <div style="font-weight: bold;">IELC Academic Department</div>
            </td>
        </tr>
    </table>
</body>
</html>
