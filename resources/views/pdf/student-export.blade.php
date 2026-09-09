<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ $title }} — IELC CRM</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
            background: #ffffff;
            color: #1e293b;
            padding: 24px;
            font-size: 11px;
            line-height: 1.4;
        }

        /* ─── Header ─────────────────────────────────────────── */
        .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #ef4444;
            padding-bottom: 14px;
            margin-bottom: 20px;
        }

        .logo-text { font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
        .logo-sub  { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; }

        .report-meta { text-align: right; }
        .report-title { font-size: 14px; font-weight: 800; color: #0f172a; }
        .report-period { font-size: 10px; font-weight: 600; color: #64748b; margin-top: 2px; }
        .report-generated { font-size: 9px; color: #94a3b8; margin-top: 2px; }

        /* ─── Filter Info ────────────────────────────────────── */
        .filter-banner {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 20px;
            font-size: 10px;
        }

        /* ─── Tables ─────────────────────────────────────────── */
        table {
            width: 100%;
            border-collapse: collapse;
            background: #ffffff;
            margin-bottom: 24px;
        }

        tr {
            page-break-inside: avoid;
        }

        thead th {
            padding: 6px 8px;
            text-align: left;
            font-size: 8.5px;
            font-weight: 800;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #334155;
        }

        tbody td {
            padding: 5px 8px;
            font-size: 9px;
            color: #334155;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
        }

        .section-title {
            font-size: 11px;
            font-weight: 800;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* ─── Footer ─────────────────────────────────────────── */
        .page-footer {
            margin-top: 20px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            font-size: 8.5px;
            color: #94a3b8;
            font-weight: 600;
        }
    </style>
</head>
<body>

    <!-- Page header -->
    <div class="page-header">
        <div>
            <div class="logo-text">IELC CRM</div>
            <div class="logo-sub">STUDENT MANAGEMENT SYSTEM</div>
        </div>

        <div class="report-meta">
            <div class="report-title">{{ $title }}</div>
            <div class="report-period">
                @if($month)
                    {{ ['', 'Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][$month] }} {{ $year }}
                @else
                    Tahun {{ $year }}
                @endif
            </div>
            <div class="report-generated">Digenerate: {{ now()->format('d M Y H:i') }}</div>
        </div>
    </div>

    @if(isset($rows['active']) || isset($rows['stop']))
        @php
            $activeRows = $rows['active'] ?? [];
            $stopRows   = $rows['stop'] ?? [];
            $filters    = $rows['filters'] ?? [];
        @endphp

        <!-- FILTER INFO BANNER -->
        <div class="filter-banner">
            <strong style="color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">FILTER:</strong>
            @if(empty($filters))
                <span style="margin-left: 6px; color: #475569; font-weight: 700;">SEMUA SISWA</span>
            @else
                <span style="margin-left: 6px; color: #334155;">
                    @foreach($filters as $k => $v)
                        <span style="display: inline-block; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 6px; margin-right: 4px;">
                            <strong>{{ $k }}:</strong> {{ $v }}
                        </span>
                    @endforeach
                </span>
            @endif
        </div>

        <!-- TABEL SISWA AKTIF -->
        <div class="section-title" style="color: #047857;">
            DAFTAR SISWA AKTIF ({{ count($activeRows) }} SISWA)
        </div>
        <table>
            <thead>
                <tr style="background-color: #047857;">
                    @foreach($headers as $h)
                        <th style="background-color: #047857; color: #ffffff;">{{ $h }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @if(empty($activeRows))
                    <tr><td colspan="{{ count($headers) }}" style="text-align:center; padding: 12px; color:#94a3b8;">Tidak ada data siswa aktif</td></tr>
                @else
                    @foreach($activeRows as $r)
                        <tr>
                            <td style="text-align: center; font-weight: bold;">{{ $r['no'] }}</td>
                            <td>{{ $r['student_number'] }}</td>
                            <td><strong>{{ $r['name'] }}</strong></td>
                            <td>{{ $r['phone'] }}</td>
                            <td>{{ $r['branch'] }}</td>
                            <td>{{ $r['school'] }}</td>
                            <td>{{ $r['grade'] }}</td>
                            <td>{{ $r['address'] }}</td>
                            <td>{{ $r['class'] }}</td>
                            <td>{{ $r['start_join'] }}</td>
                            <td><span style="color: #047857; font-weight: bold;">{{ $r['status'] }}</span></td>
                        </tr>
                    @endforeach
                @endif
            </tbody>
        </table>

        <!-- TABEL SISWA STOP -->
        <div class="section-title" style="color: #be123c; margin-top: 10px;">
            DAFTAR SISWA STOP / BERHENTI ({{ count($stopRows) }} SISWA)
        </div>
        <table>
            <thead>
                <tr style="background-color: #be123c;">
                    @foreach($headers as $h)
                        <th style="background-color: #be123c; color: #ffffff;">{{ $h }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @if(empty($stopRows))
                    <tr><td colspan="{{ count($headers) }}" style="text-align:center; padding: 12px; color:#94a3b8;">Tidak ada data siswa stop</td></tr>
                @else
                    @foreach($stopRows as $r)
                        <tr>
                            <td style="text-align: center; font-weight: bold;">{{ $r['no'] }}</td>
                            <td>{{ $r['student_number'] }}</td>
                            <td><strong>{{ $r['name'] }}</strong></td>
                            <td>{{ $r['phone'] }}</td>
                            <td>{{ $r['branch'] }}</td>
                            <td>{{ $r['school'] }}</td>
                            <td>{{ $r['grade'] }}</td>
                            <td>{{ $r['address'] }}</td>
                            <td>{{ $r['class'] }}</td>
                            <td>{{ $r['start_join'] }}</td>
                            <td><span style="color: #be123c; font-weight: bold;">{{ $r['status'] }}</span></td>
                        </tr>
                    @endforeach
                @endif
            </tbody>
        </table>
    @else
        <!-- Standard Data table -->
        <table>
            <thead>
                <tr style="background-color: #0f172a;">
                    @foreach($headers as $h)
                        <th style="background-color: #0f172a; color: #ffffff;">{{ $h }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($rows as $row)
                    @if(count($row) === 0)
                        <tr><td colspan="{{ count($headers) }}" style="padding:4px;border:none;background:transparent;"></td></tr>
                    @elseif(count($row) === 1 || (isset($row[1]) && $row[1] === ''))
                        <tr class="section-row">
                            <td colspan="{{ count($headers) }}">{{ $row[0] }}</td>
                        </tr>
                    @else
                        <tr>
                            @foreach($row as $cell)
                                <td>{{ $cell }}</td>
                            @endforeach
                        </tr>
                    @endif
                @endforeach
            </tbody>
        </table>
    @endif

    <!-- Footer -->
    <div class="page-footer">
        <span>IELC CRM</span>
        <span>{{ $filename }}</span>
        <span>{{ now()->format('d M Y H:i:s') }}</span>
    </div>

</body>
</html>
