<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            color: #1e293b;
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
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .header p {
            margin: 0;
            font-size: 11px;
            color: #475569;
            font-weight: 600;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-bottom: 25px;
        }
        th, td {
            border: 1px solid #64748b;
            padding: 5px 6px;
            text-align: center;
        }
        th {
            background-color: #cbd5e1;
            color: #0f172a;
            font-weight: bold;
        }
        th.title-header {
            background-color: #0f172a;
            color: #ffffff;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 8px;
            text-align: center;
            border-color: #334155;
        }
        th.title-header-offline {
            background-color: #d1fae5;
            color: #065f46;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 8px;
            text-align: center;
            border-color: #34d399;
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
        th.grade-header {
            background-color: #e2e8f0;
            color: #1e293b;
            font-size: 10px;
            font-weight: bold;
        }
        th.month-header {
            background-color: #cbd5e1;
            min-width: 70px;
            text-align: left;
        }
        tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .month-col {
            font-weight: bold;
            text-align: left;
            background-color: #ffffff;
            white-space: nowrap;
        }
        tfoot tr.total-row {
            background-color: #1e293b;
            color: #ffffff;
            font-weight: bold;
        }
        tfoot tr.total-row td {
            border-color: #334155;
            color: #ffffff;
        }
        tfoot tr.avg-row {
            background-color: #334155;
            color: #f8fafc;
            font-weight: bold;
        }
        tfoot tr.avg-row td {
            border-color: #475569;
            color: #cbd5e1;
        }
        .empty-cell {
            color: #334155;
            font-weight: 600;
        }
        .bg-cell {
            background-color: #f1f5f9;
        }
    </style>
</head>
<body>

    <div class="header">
        <h2>{{ $title }}</h2>
        <p>Laporan Pola Join Siswa Berdasarkan Tingkat Pendidikan (Grades) — Tahun {{ $year }} {{ $branchName ? 'Cabang ' . $branchName . ' — ' : '' }}{{ $month ? 'Bulan ' . $month : '' }} {{ $modeFilter ? '(' . strtoupper($modeFilter) . ')' : '(SEMUA MODE)' }}</p>
    </div>

    @php
        $totalCols = count($gradeList) + 2;
    @endphp

    <table>
        <thead>
            <tr>
                <th colspan="{{ $totalCols }}" class="{{ $modeFilter === 'offline' ? 'title-header-offline' : ($modeFilter === 'online' ? 'title-header-online' : 'title-header') }}">
                    Data Siswa {{ $modeFilter === 'offline' ? 'On Campus' : ($modeFilter === 'online' ? 'Online' : 'Gabungan (Semua Mode)') }} per Tingkat Pendidikan (Grades)
                </th>
            </tr>
            <tr>
                <th class="month-header">Month</th>
                @foreach($gradeList as $g)
                    <th class="grade-header">{{ $g }}</th>
                @endforeach
                <th class="grade-header" style="background-color: #cbd5e1;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($months as $m)
                @php
                    $rowSum = 0;
                @endphp
                <tr>
                    <td class="month-col">{{ $m['label'] }}</td>
                    @foreach($gradeList as $g)
                        @php
                            if ($modeFilter === 'offline') {
                                $val = $m['grades_offline'][$g] ?? 0;
                            } elseif ($modeFilter === 'online') {
                                $val = $m['grades_online'][$g] ?? 0;
                            } else {
                                $val = ($m['grades_offline'][$g] ?? 0) + ($m['grades_online'][$g] ?? 0);
                            }
                            $rowSum += $val;
                        @endphp
                        <td class="{{ $val == 0 ? 'empty-cell' : '' }} bg-cell">{{ $val }}</td>
                    @endforeach
                    <td class="font-bold" style="background-color: #e2e8f0;">{{ $rowSum }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            @php
                $avgCount = max(1, count(array_filter($months, function($m) use ($gradeList, $modeFilter) {
                    foreach($gradeList as $g) {
                        if ($modeFilter === 'offline') {
                            if (($m['grades_offline'][$g] ?? 0) > 0) return true;
                        } elseif ($modeFilter === 'online') {
                            if (($m['grades_online'][$g] ?? 0) > 0) return true;
                        } else {
                            if (($m['grades_offline'][$g] ?? 0) + ($m['grades_online'][$g] ?? 0) > 0) return true;
                        }
                    }
                    return false;
                })));
            @endphp
            <tr class="total-row">
                <td class="month-col" style="background-color: #1e293b; color: #ffffff;">Total</td>
                @php $grandTot = 0; @endphp
                @foreach($gradeList as $g)
                    @php
                        if ($modeFilter === 'offline') {
                            $totG = $totals_offline[$g] ?? 0;
                        } elseif ($modeFilter === 'online') {
                            $totG = $totals_online[$g] ?? 0;
                        } else {
                            $totG = ($totals_offline[$g] ?? 0) + ($totals_online[$g] ?? 0);
                        }
                        $grandTot += $totG;
                    @endphp
                    <td>{{ $totG }}</td>
                @endforeach
                <td style="color: #6ee7b7; font-weight: bold;">{{ $grandTot }}</td>
            </tr>
            <tr class="avg-row">
                <td class="month-col" style="background-color: #334155; color: #f8fafc;">Average</td>
                @foreach($gradeList as $g)
                    @php
                        if ($modeFilter === 'offline') {
                            $totG = $totals_offline[$g] ?? 0;
                        } elseif ($modeFilter === 'online') {
                            $totG = $totals_online[$g] ?? 0;
                        } else {
                            $totG = ($totals_offline[$g] ?? 0) + ($totals_online[$g] ?? 0);
                        }
                    @endphp
                    <td>{{ round($totG / $avgCount, 1) }}</td>
                @endforeach
                <td style="color: #6ee7b7; font-weight: bold;">{{ round($grandTot / $avgCount, 1) }}</td>
            </tr>
        </tfoot>
    </table>

</body>
</html>
