<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            color: #0f172a;
            margin: 0;
            padding: 10px;
        }
        .header {
            text-align: center;
            margin-bottom: 18px;
        }
        .header h2 {
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: bold;
            color: #881337;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .header p {
            margin: 0;
            font-size: 11px;
            color: #334155;
            font-weight: 700;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 25px;
        }
        th, td {
            border: 1px solid #475569;
            padding: 6px 7px;
            text-align: center;
        }
        th {
            background-color: #cbd5e1;
            color: #0f172a;
            font-weight: bold;
        }
        th.title-header {
            background-color: #881337;
            color: #ffffff;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 8px;
            text-align: center;
            border-color: #4c0519;
        }
        th.title-header-offline {
            background-color: #fecdd3;
            color: #881337;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 8px;
            text-align: center;
            border-color: #fda4af;
        }
        th.title-header-online {
            background-color: #e0e7ff;
            color: #3730a3;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 8px;
            text-align: center;
            border-color: #818cf8;
        }
        th.col-header {
            background-color: #ffe4e6;
            color: #881337;
            font-size: 10px;
            font-weight: bold;
        }
        th.month-header {
            background-color: #94a3b8;
            color: #0f172a;
            min-width: 70px;
            text-align: left;
        }
        tbody tr:nth-child(even) {
            background-color: #fff1f2;
        }
        .month-col {
            font-weight: bold;
            text-align: left;
            background-color: #ffffff;
            color: #0f172a;
            white-space: nowrap;
        }
        tfoot tr.total-row {
            background-color: #881337;
            color: #ffffff;
            font-weight: bold;
        }
        tfoot tr.total-row td {
            border-color: #4c0519;
            color: #ffffff;
            font-size: 11px;
        }
        tfoot tr.avg-row {
            background-color: #4c0519;
            color: #ffffff;
            font-weight: bold;
        }
        tfoot tr.avg-row td {
            border-color: #881337;
            color: #ffffff;
            font-size: 10.5px;
        }
        .empty-cell {
            color: #334155;
            font-weight: 600;
        }
        .value-cell {
            color: #9f1239;
            font-weight: 900;
            font-size: 11.5px;
            background-color: #ffe4e6;
        }
        .bg-cell {
            background-color: #ffffff;
        }
    </style>
</head>
<body>

    <div class="header">
        <h2>{{ $title }}</h2>
        <p>Laporan Siswa Stop — Tahun {{ $year }} {{ $branchName ? 'Cabang ' . $branchName . ' — ' : '' }}{{ $month ? 'Bulan ' . $month : '' }} {{ $modeFilter ? '(' . strtoupper($modeFilter) . ')' : '(SEMUA MODE)' }}</p>
    </div>

    @php
        $totalCols = count($columns) + 2;
    @endphp

    <table>
        <thead>
            <tr>
                <th colspan="{{ $totalCols }}" class="{{ $modeFilter === 'offline' ? 'title-header-offline' : ($modeFilter === 'online' ? 'title-header-online' : 'title-header') }}">
                    Laporan Siswa Stop {{ $modeFilter === 'offline' ? 'On Campus' : ($modeFilter === 'online' ? 'Online' : 'Gabungan (Semua Mode)') }} — {{ $subTitle }}
                </th>
            </tr>
            <tr>
                <th class="month-header">Bulan</th>
                @foreach($columns as $col)
                    <th class="col-header">{{ $col }}</th>
                @endforeach
                <th class="col-header" style="background-color: #fecdd3; color: #881337;">Total Stop</th>
            </tr>
        </thead>
        <tbody>
            @foreach($months as $m)
                @php
                    $rowSum = 0;
                @endphp
                <tr>
                    <td class="month-col">{{ $m['label'] }}</td>
                    @foreach($columns as $col)
                        @php
                            if ($modeFilter === 'offline') {
                                $val = $m['offline'][$col] ?? 0;
                            } elseif ($modeFilter === 'online') {
                                $val = $m['online'][$col] ?? 0;
                            } else {
                                $val = ($m['offline'][$col] ?? 0) + ($m['online'][$col] ?? 0);
                            }
                            $rowSum += $val;
                        @endphp
                        <td class="{{ $val == 0 ? 'empty-cell' : 'value-cell' }}">{{ $val }}</td>
                    @endforeach
                    <td class="font-bold" style="background-color: #ffe4e6; color: #881337; font-weight: 900; font-size: 11px;">{{ $rowSum }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            @php
                $avgCount = max(1, count(array_filter($months, function($m) use ($columns, $modeFilter) {
                    foreach($columns as $col) {
                        if ($modeFilter === 'offline') {
                            if (($m['offline'][$col] ?? 0) > 0) return true;
                        } elseif ($modeFilter === 'online') {
                            if (($m['online'][$col] ?? 0) > 0) return true;
                        } else {
                            if (($m['offline'][$col] ?? 0) + ($m['online'][$col] ?? 0) > 0) return true;
                        }
                    }
                    return false;
                })));
            @endphp
            <tr class="total-row">
                <td class="month-col" style="background-color: #881337; color: #ffffff;">Total</td>
                @php $grandTot = 0; @endphp
                @foreach($columns as $col)
                    @php
                        if ($modeFilter === 'offline') {
                            $totCol = $totals_offline[$col] ?? 0;
                        } elseif ($modeFilter === 'online') {
                            $totCol = $totals_online[$col] ?? 0;
                        } else {
                            $totCol = ($totals_offline[$col] ?? 0) + ($totals_online[$col] ?? 0);
                        }
                        $grandTot += $totCol;
                    @endphp
                    <td>{{ $totCol }}</td>
                @endforeach
                <td style="color: #ffffff; font-weight: 900; font-size: 12px; background-color: #4c0519;">{{ $grandTot }}</td>
            </tr>
            <tr class="avg-row">
                <td class="month-col" style="background-color: #4c0519; color: #ffffff;">Average</td>
                @foreach($columns as $col)
                    @php
                        if ($modeFilter === 'offline') {
                            $totCol = $totals_offline[$col] ?? 0;
                        } elseif ($modeFilter === 'online') {
                            $totCol = $totals_online[$col] ?? 0;
                        } else {
                            $totCol = ($totals_offline[$col] ?? 0) + ($totals_online[$col] ?? 0);
                        }
                    @endphp
                    <td>{{ round($totCol / $avgCount, 1) }}</td>
                @endforeach
                <td style="color: #ffffff; font-weight: 900; font-size: 12px;">{{ round($grandTot / $avgCount, 1) }}</td>
            </tr>
        </tfoot>
    </table>

</body>
</html>
