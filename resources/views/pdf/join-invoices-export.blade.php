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
        th.pkg-header {
            background-color: #e2e8f0;
            color: #1e293b;
            font-size: 10.5px;
            font-weight: bold;
        }
        th.sub-header {
            background-color: #f1f5f9;
            color: #334155;
            font-size: 9px;
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
            background-color: #eff6ff;
        }
    </style>
</head>
<body>

    <div class="header">
        <h2>{{ $title }}</h2>
        <p>Laporan Pola Join Siswa New & Extend per Paket — Tahun {{ $year }} {{ $branchName ? 'Cabang ' . $branchName . ' — ' : '' }}{{ $month ? 'Bulan ' . $month : '' }} {{ $modeFilter ? '(' . strtoupper($modeFilter) . ')' : '(SEMUA MODE)' }}</p>
    </div>

    @php
        $totalCols = (count($packageList) * 3) + 1;
    @endphp

    {{-- SINGLE TABLE BASED ON MODE FILTER --}}
    <table>
        <thead>
            <tr>
                <th colspan="{{ $totalCols }}" class="{{ $modeFilter === 'offline' ? 'title-header-offline' : ($modeFilter === 'online' ? 'title-header-online' : 'title-header') }}">
                    Data Siswa {{ $modeFilter === 'offline' ? 'On Campus' : ($modeFilter === 'online' ? 'Online' : 'Gabungan (Semua Mode)') }} New & Extend per Paket
                </th>
            </tr>
            <tr>
                <th rowspan="2" class="month-header">Month</th>
                @foreach($packageList as $pkg)
                    <th colspan="3" class="pkg-header">{{ $pkg }}</th>
                @endforeach
            </tr>
            <tr>
                @foreach($packageList as $pkg)
                    <th class="sub-header">New</th>
                    <th class="sub-header">Extend</th>
                    <th class="sub-header" style="background-color: #e2e8f0; font-weight: bold;">Total</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($months as $m)
                <tr>
                    <td class="month-col">{{ $m['label'] }}</td>
                    @foreach($packageList as $pkg)
                        @php
                            if ($modeFilter === 'offline') {
                                $newVal = $m['packages_offline'][$pkg]['new'] ?? 0;
                                $extVal = $m['packages_offline'][$pkg]['extend'] ?? 0;
                            } elseif ($modeFilter === 'online') {
                                $newVal = $m['packages_online'][$pkg]['new'] ?? 0;
                                $extVal = $m['packages_online'][$pkg]['extend'] ?? 0;
                            } else {
                                $newVal = ($m['packages_offline'][$pkg]['new'] ?? 0) + ($m['packages_online'][$pkg]['new'] ?? 0);
                                $extVal = ($m['packages_offline'][$pkg]['extend'] ?? 0) + ($m['packages_online'][$pkg]['extend'] ?? 0);
                            }
                            $totVal = $newVal + $extVal;
                        @endphp
                        <td class="{{ $newVal == 0 ? 'empty-cell' : '' }} bg-cell">{{ $newVal }}</td>
                        <td class="{{ $extVal == 0 ? 'empty-cell' : '' }} bg-cell">{{ $extVal }}</td>
                        <td class="font-bold bg-cell">{{ $totVal }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            @php
                $avgCount = max(1, count(array_filter($months, function($m) use ($packageList, $modeFilter) {
                    foreach($packageList as $pkg) {
                        if ($modeFilter === 'offline') {
                            if (($m['packages_offline'][$pkg]['new'] ?? 0) + ($m['packages_offline'][$pkg]['extend'] ?? 0) > 0) return true;
                        } elseif ($modeFilter === 'online') {
                            if (($m['packages_online'][$pkg]['new'] ?? 0) + ($m['packages_online'][$pkg]['extend'] ?? 0) > 0) return true;
                        } else {
                            if (($m['packages_offline'][$pkg]['new'] ?? 0) + ($m['packages_offline'][$pkg]['extend'] ?? 0) + ($m['packages_online'][$pkg]['new'] ?? 0) + ($m['packages_online'][$pkg]['extend'] ?? 0) > 0) return true;
                        }
                    }
                    return false;
                })));
            @endphp
            <tr class="total-row">
                <td class="month-col" style="background-color: #1e293b; color: #ffffff;">Total</td>
                @foreach($packageList as $pkg)
                    @php
                        if ($modeFilter === 'offline') {
                            $totNew = $totals_offline[$pkg]['new'] ?? 0;
                            $totExt = $totals_offline[$pkg]['extend'] ?? 0;
                        } elseif ($modeFilter === 'online') {
                            $totNew = $totals_online[$pkg]['new'] ?? 0;
                            $totExt = $totals_online[$pkg]['extend'] ?? 0;
                        } else {
                            $totNew = ($totals_offline[$pkg]['new'] ?? 0) + ($totals_online[$pkg]['new'] ?? 0);
                            $totExt = ($totals_offline[$pkg]['extend'] ?? 0) + ($totals_online[$pkg]['extend'] ?? 0);
                        }
                        $totSum = $totNew + $totExt;
                    @endphp
                    <td>{{ $totNew }}</td>
                    <td>{{ $totExt }}</td>
                    <td style="color: #6ee7b7; font-weight: bold;">{{ $totSum }}</td>
                @endforeach
            </tr>
            <tr class="avg-row">
                <td class="month-col" style="background-color: #334155; color: #f8fafc;">Average</td>
                @foreach($packageList as $pkg)
                    @php
                        if ($modeFilter === 'offline') {
                            $totNew = $totals_offline[$pkg]['new'] ?? 0;
                            $totExt = $totals_offline[$pkg]['extend'] ?? 0;
                        } elseif ($modeFilter === 'online') {
                            $totNew = $totals_online[$pkg]['new'] ?? 0;
                            $totExt = $totals_online[$pkg]['extend'] ?? 0;
                        } else {
                            $totNew = ($totals_offline[$pkg]['new'] ?? 0) + ($totals_online[$pkg]['new'] ?? 0);
                            $totExt = ($totals_offline[$pkg]['extend'] ?? 0) + ($totals_online[$pkg]['extend'] ?? 0);
                        }
                        $totSum = $totNew + $totExt;
                    @endphp
                    <td>{{ round($totNew / $avgCount, 1) }}</td>
                    <td>{{ round($totExt / $avgCount, 1) }}</td>
                    <td style="color: #6ee7b7; font-weight: bold;">{{ round($totSum / $avgCount, 1) }}</td>
                @endforeach
            </tr>
        </tfoot>
    </table>

</body>
</html>
