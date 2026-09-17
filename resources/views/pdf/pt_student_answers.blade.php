<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Lembar Jawaban Siswa - {{ $candidate_name }}</title>
    <style>
        @page {
            margin: 12mm 14mm 14mm 14mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0f172a;
            font-size: 10.5px;
            line-height: 1.4;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        .logo-cell {
            vertical-align: middle;
            width: 50%;
        }
        .branch-cell {
            text-align: right;
            vertical-align: middle;
            font-size: 9.5px;
            color: #64748b;
        }
        .brand-title {
            font-size: 26px;
            font-weight: 900;
            color: #000000;
            letter-spacing: 0.5px;
            line-height: 1;
        }
        .page-title {
            text-align: center;
            margin-bottom: 14px;
        }
        .page-title h1 {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 2px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .page-title p {
            font-size: 9.5px;
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
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 14px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 2.5px 0;
            vertical-align: middle;
            font-size: 10px;
        }
        .info-label {
            width: 110px;
            color: #64748b;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8.5px;
        }
        .info-val {
            color: #0f172a;
            font-weight: 600;
        }

        /* Question Box */
        .question-card {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            background-color: #ffffff;
            overflow: hidden;
        }
        .question-header {
            background-color: #f1f5f9;
            border-bottom: 1px solid #cbd5e1;
            padding: 6px 10px;
        }
        .question-title {
            font-size: 10.5px;
            font-weight: 800;
            color: #0f172a;
        }
        .question-badge {
            float: right;
            padding: 1px 7px;
            border-radius: 4px;
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-perfect {
            background-color: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
        }
        .badge-partial {
            background-color: #fef3c7;
            color: #b45309;
            border: 1px solid #fde68a;
        }
        .badge-wrong {
            background-color: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fca5a5;
        }

        /* Targets Table */
        .targets-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
        }
        .targets-table th {
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 4px 8px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8px;
            color: #475569;
            text-align: left;
        }
        .targets-table td {
            border-bottom: 1px solid #f1f5f9;
            padding: 4px 8px;
            vertical-align: middle;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }

        .tag-correct {
            color: #15803d;
            font-weight: bold;
        }
        .tag-wrong {
            color: #dc2626;
            font-weight: bold;
        }
        .student-val {
            font-weight: 600;
            color: #0f172a;
        }
        .student-val-wrong {
            font-weight: 600;
            color: #dc2626;
            text-decoration: line-through;
        }
        .expected-val {
            color: #15803d;
            font-weight: 600;
        }

        /* Footer */
        .footer-table {
            width: 100%;
            margin-top: 15px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            font-size: 8.5px;
            color: #94a3b8;
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
                <div>Lembar Jawaban Siswa Resmi (Student Answer Sheet)</div>
            </td>
        </tr>
    </table>

    <!-- Banner -->
    <div class="page-title">
        <h1>Lembar Jawaban Lengkap Siswa</h1>
        <p>Student Response & Answer Sheet Breakdown</p>
    </div>

    <!-- Candidate Info -->
    <div class="info-card">
        <table class="info-table">
            <tr>
                <td class="info-label">Nama Siswa:</td>
                <td class="info-val" style="font-size: 11.5px; color: #0f172a; font-weight: bold;">{{ $candidate_name }}</td>
                <td class="info-label">Tanggal Tes:</td>
                <td class="info-val">{{ $test_date }}</td>
            </tr>
            <tr>
                <td class="info-label">Program Tes:</td>
                <td class="info-val">{{ $exam->title }} ({{ $category }})</td>
                <td class="info-label">Pencapaian:</td>
                <td class="info-val" style="color: #15803d; font-weight: bold;">
                    {{ $achievement_text }} ({{ $percentage !== null ? $percentage . '%' : '-' }})
                </td>
            </tr>
        </table>
    </div>

    <!-- Questions Loop -->
    @foreach($questions as $q)
        <div class="question-card">
            <div class="question-header">
                <div class="question-badge {{ $q['is_perfect'] ? 'badge-perfect' : ($q['correct_targets'] > 0 ? 'badge-partial' : 'badge-wrong') }}">
                    {{ $q['correct_targets'] }} / {{ $q['total_targets'] }} {{ $unit_label }} Benar
                </div>
                <div class="question-title">
                    Soal #{{ $q['number'] }}: {{ $q['instruction'] }}
                </div>
            </div>

            <table class="targets-table">
                <thead>
                    <tr>
                        <th style="width: 25px;" class="text-center">No</th>
                        <th style="width: 110px;">Kotak Isian / Target</th>
                        <th>Jawaban Siswa</th>
                        <th>Kunci Jawaban</th>
                        <th style="width: 80px;" class="text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($q['targets'] as $tgt)
                        <tr style="background-color: {{ $tgt['is_correct'] ? '#ffffff' : '#fff5f5' }};">
                            <td class="text-center" style="color: #64748b; font-weight: bold;">{{ $tgt['target_num'] }}</td>
                            <td>
                                <span style="font-weight: 600; color: #334155;">{{ $tgt['label'] }}</span>
                            </td>
                            <td>
                                <span class="{{ $tgt['is_correct'] ? 'student-val' : 'student-val-wrong' }}">
                                    {{ $tgt['user_answer'] }}
                                </span>
                            </td>
                            <td>
                                <span class="expected-val">{{ $tgt['expected'] }}</span>
                            </td>
                            <td class="text-center">
                                @if($tgt['is_correct'])
                                    <span class="tag-correct">BENAR</span>
                                @else
                                    <span class="tag-wrong">SALAH</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endforeach

    <!-- Footer -->
    <table class="footer-table">
        <tr>
            <td>
                IELC &bull; Dokumen Lembar Jawaban Resmi Siswa &bull; Dicetak pada {{ now()->translatedFormat('d F Y, H:i') }}
            </td>
            <td class="text-right">
                Halaman Terverifikasi
            </td>
        </tr>
    </table>
</body>
</html>
