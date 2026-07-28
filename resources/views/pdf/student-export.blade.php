<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ $title }} — IELC CRM</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f8fafc;
            color: #1e293b;
            padding: 32px;
            font-size: 12px;
        }

        /* ─── Header ─────────────────────────────────────────── */
        .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid #ef4444;
            padding-bottom: 20px;
            margin-bottom: 28px;
        }

        .logo-block { display: flex; align-items: center; gap: 12px; }

        .logo-icon {
            width: 44px; height: 44px;
            background: #ef4444;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            color: #fff;
            font-size: 20px;
            font-weight: 900;
        }

        .logo-text { font-size: 18px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
        .logo-sub  { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }

        .report-meta { text-align: right; }
        .report-title { font-size: 15px; font-weight: 900; color: #0f172a; }
        .report-period { font-size: 10px; font-weight: 700; color: #64748b; margin-top: 4px; }
        .report-generated { font-size: 9px; color: #94a3b8; margin-top: 2px; }

        /* ─── Table ─────────────────────────────────────────── */
        table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,.08);
        }

        thead tr { background: #0f172a; }
        thead th {
            padding: 12px 16px;
            text-align: left;
            font-size: 9px;
            font-weight: 900;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            white-space: nowrap;
        }

        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody tr:hover { background: #f1f5f9; }

        tbody td {
            padding: 10px 16px;
            font-size: 11px;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
        }

        tbody td:first-child { font-weight: 700; color: #0f172a; }

        /* section separator row */
        tbody tr.section-row td {
            background: #eff6ff;
            font-size: 10px;
            font-weight: 900;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 8px 16px;
            border-top: 2px solid #bfdbfe;
            border-bottom: 2px solid #bfdbfe;
        }

        /* ─── Footer ─────────────────────────────────────────── */
        .page-footer {
            margin-top: 32px;
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #94a3b8;
            font-weight: 600;
        }

        /* ─── Print ─────────────────────────────────────────── */
        @media print {
            body { background: #fff; padding: 16px; }
            .no-print { display: none !important; }
            table { box-shadow: none; }
        }

        /* ─── Action bar ─────────────────────────────────────── */
        .action-bar {
            display: flex;
            gap: 10px;
            margin-bottom: 24px;
        }

        .btn {
            padding: 8px 18px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            border: none;
            transition: opacity 0.2s;
        }

        .btn:hover { opacity: 0.85; }
        .btn-print  { background: #0f172a; color: #fff; }
        .btn-close  { background: #f1f5f9; color: #475569; }
    </style>
</head>
<body>

    <!-- Action bar (hidden on print) -->
    <div class="action-bar no-print">
        <button class="btn btn-print" onclick="window.print()">🖨 Print / Save as PDF</button>
        <button class="btn btn-close" onclick="window.close()">✕ Tutup</button>
    </div>

    <!-- Page header -->
    <div class="page-header">
        <div class="logo-block">
            <div class="logo-icon">🎓</div>
            <div>
                <div class="logo-text">IELC CRM</div>
                <div class="logo-sub">Student Management System</div>
            </div>
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

    <!-- Data table -->
    <table>
        <thead>
            <tr>
                @foreach($headers as $h)
                    <th>{{ $h }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
                @if(count($row) === 0)
                    {{-- Empty row spacer --}}
                    <tr><td colspan="{{ count($headers) }}" style="padding:4px;border:none;background:transparent;"></td></tr>
                @elseif(count($row) === 1 || (isset($row[1]) && $row[1] === ''))
                    {{-- Section header row --}}
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

    <!-- Footer -->
    <div class="page-footer">
        <span>IELC CRM — Confidential</span>
        <span>{{ $filename }}</span>
        <span>{{ now()->format('d M Y H:i:s') }}</span>
    </div>

</body>
</html>
