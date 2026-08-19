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
            font-size: 10px;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #64748b;
            padding: 5px 8px;
            text-align: center;
        }
        th {
            background-color: #f8fafc;
            color: #0f172a;
            font-weight: bold;
        }
        th.month-header {
            background-color: #cbd5e1;
            min-width: 80px;
            text-align: left;
        }
        th.pkg-header {
            background-color: #f1f5f9;
            color: #1e293b;
            text-transform: uppercase;
        }
        th.stopped-header {
            background-color: #ffe4e6;
            color: #9f1239;
            text-transform: uppercase;
        }
        th.total-header {
            background-color: #e2e8f0;
            color: #0f172a;
            text-transform: uppercase;
        }
        th.snapshot-header {
            background-color: #e0e7ff;
            color: #3730a3;
            text-transform: uppercase;
        }
        th.title-header-single {
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 8px;
            text-align: center;
        }
        .campus-sub { color: #059669; }
        .online-sub { color: #4f46e5; }
        .stopped-sub { color: #e11d48; }

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
    </style>
</head>
<body>

    <div class="header">
        <h2>{{ $title }}</h2>
        <p>Laporan Pola Join Siswa — Tahun {{ $year }} {{ $branchName ? 'Cabang ' . $branchName . ' — ' : '' }}{{ $month ? 'Bulan ' . $month : '' }} {{ $modeFilter ? '(' . strtoupper($modeFilter) . ')' : '(SEMUA MODE)' }}</p>
    </div>

    @if(!$modeFilter)
        {{-- ═══════════════════════════════════════════════════════════════════
             1. KONDISI DEFAULT / SEMUA MODE: TABEL PIVOT GABUNGAN (COMBINED)
        ═══════════════════════════════════════════════════════════════════ --}}
        <table>
            <thead>
                <!-- Row 1: Package names & Siswa Out & Siswa In & Total Students -->
                <tr>
                    <th rowspan="2" class="month-header">BULAN</th>
                    @foreach($packageList as $pkg)
                        <th colspan="2" class="pkg-header">{{ $pkg }}</th>
                    @endforeach
                    <th colspan="2" class="stopped-header">SISWA OUT</th>
                    <th colspan="2" class="total-header">SISWA IN</th>
                    <th rowspan="2" class="snapshot-header">TOTAL STUDENTS</th>
                </tr>
                <!-- Row 2: Sub-headers ON CAMPUS / ONLINE -->
                <tr>
                    @foreach($packageList as $pkg)
                        <th class="campus-sub">ON CAMPUS</th>
                        <th class="online-sub">ONLINE</th>
                    @endforeach
                    <th class="stopped-sub">ON CAMPUS</th>
                    <th class="stopped-sub">ONLINE</th>
                    <th class="campus-sub">ON CAMPUS</th>
                    <th class="online-sub">ONLINE</th>
                </tr>
            </thead>
            <tbody>
                @foreach($months as $m)
                    @php
                        $rowOffline = 0;
                        $rowOnline  = 0;
                        foreach($packageList as $pkg) {
                            $rowOffline += $m['packages'][$pkg]['offline'] ?? 0;
                            $rowOnline  += $m['packages'][$pkg]['online']  ?? 0;
                        }
                        $stoppedOff = $m['stopped']['offline'] ?? 0;
                        $stoppedOn  = $m['stopped']['online']  ?? 0;
                        $totStudents = $m['total_students']    ?? 0;
                    @endphp
                    <tr>
                        <td class="month-col">{{ strtoupper($m['label']) }}</td>
                        @foreach($packageList as $pkg)
                            @php
                                $c = $m['packages'][$pkg]['offline'] ?? 0;
                                $o = $m['packages'][$pkg]['online']  ?? 0;
                            @endphp
                            <td class="{{ $c == 0 ? 'empty-cell' : '' }}">{{ $c }}</td>
                            <td class="{{ $o == 0 ? 'empty-cell' : '' }}">{{ $o }}</td>
                        @endforeach
                        <td style="background-color: #fff1f2;" class="{{ $stoppedOff == 0 ? 'empty-cell' : '' }}">{{ $stoppedOff }}</td>
                        <td style="background-color: #fff1f2;" class="{{ $stoppedOn == 0 ? 'empty-cell' : '' }}">{{ $stoppedOn }}</td>
                        <td style="font-weight: bold; background-color: #ecfdf5;">{{ $rowOffline }}</td>
                        <td style="font-weight: bold; background-color: #e0e7ff;">{{ $rowOnline }}</td>
                        <td style="font-weight: bold; background-color: #e0e7ff;">{{ $totStudents }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                @php
                    $grandOffline = 0;
                    $grandOnline  = 0;
                    foreach($packageList as $pkg) {
                        $grandOffline += $totals[$pkg]['offline'] ?? 0;
                        $grandOnline  += $totals[$pkg]['online']  ?? 0;
                    }
                    $avgCount = max(1, count(array_filter($months, fn($m) => 
                        array_sum(array_column($m['packages'], 'offline')) + 
                        array_sum(array_column($m['packages'], 'online')) + 
                        ($m['stopped']['offline'] ?? 0) + ($m['stopped']['online'] ?? 0) > 0
                    )));
                    $totSnapshotsSum = array_sum(array_column($months, 'total_students'));
                @endphp
                <!-- Total Row -->
                <tr class="total-row">
                    <td class="month-col" style="background-color: #1e293b; color: #ffffff;">TOTAL</td>
                    @foreach($packageList as $pkg)
                        <td style="color: #6ee7b7;">{{ $totals[$pkg]['offline'] ?? 0 }}</td>
                        <td style="color: #a5b4fc;">{{ $totals[$pkg]['online']  ?? 0 }}</td>
                    @endforeach
                    <td style="color: #fca5a5;">{{ $stoppedTotals['offline'] ?? 0 }}</td>
                    <td style="color: #fca5a5;">{{ $stoppedTotals['online']  ?? 0 }}</td>
                    <td style="color: #6ee7b7;">{{ $grandOffline }}</td>
                    <td style="color: #a5b4fc;">{{ $grandOnline }}</td>
                    <td style="color: #fef08a; font-weight: bold;">{{ $totSnapshotsSum }}</td>
                </tr>
                <!-- Average Row -->
                <tr class="avg-row">
                    <td class="month-col" style="background-color: #334155; color: #f8fafc;">AVG / BULAN</td>
                    @foreach($packageList as $pkg)
                        <td>{{ round(($totals[$pkg]['offline'] ?? 0) / $avgCount, 1) }}</td>
                        <td>{{ round(($totals[$pkg]['online']  ?? 0) / $avgCount, 1) }}</td>
                    @endforeach
                    <td>{{ round(($stoppedTotals['offline'] ?? 0) / $avgCount, 1) }}</td>
                    <td>{{ round(($stoppedTotals['online']  ?? 0) / $avgCount, 1) }}</td>
                    <td>{{ round($grandOffline / $avgCount, 1) }}</td>
                    <td>{{ round($grandOnline / $avgCount, 1) }}</td>
                    <td style="color: #fef08a; font-weight: bold;">{{ round($totSnapshotsSum / $avgCount, 1) }}</td>
                </tr>
            </tfoot>
        </table>

    @elseif($modeFilter === 'offline')
        {{-- ═══════════════════════════════════════════════════════════════════
             2. KONDISI FILTER: ON CAMPUS (OFFLINE) ONLY
        ═══════════════════════════════════════════════════════════════════ --}}
        @php $totalCols = count($packageList) + 3; @endphp
        <table>
            <thead>
                <tr>
                    <th colspan="{{ $totalCols }}" class="title-header-single" style="background-color: #d1fae5; color: #065f46; border-color: #34d399;">
                        Data Siswa In On Campus
                    </th>
                </tr>
                <tr>
                    <th class="month-header">Month</th>
                    @foreach($packageList as $pkg)
                        <th>{{ $pkg }}</th>
                    @endforeach
                    <th style="background-color: #bfdbfe; color: #1e3a8a;">Siswa In Total</th>
                    <th style="background-color: #fecdd3; color: #881337;">Siswa Out</th>
                </tr>
            </thead>
            <tbody>
                @foreach($months as $m)
                    @php
                        $rowInOffline = 0;
                        foreach($packageList as $pkg) {
                            $rowInOffline += $m['packages'][$pkg]['offline'] ?? 0;
                        }
                        $rowOutOffline = $m['stopped']['offline'] ?? 0;
                    @endphp
                    <tr>
                        <td class="month-col">{{ $m['label'] }}</td>
                        @foreach($packageList as $pkg)
                            @php $val = $m['packages'][$pkg]['offline'] ?? 0; @endphp
                            <td class="{{ $val == 0 ? 'empty-cell' : '' }}">{{ $val }}</td>
                        @endforeach
                        <td style="font-weight: bold; background-color: #eff6ff;">{{ $rowInOffline }}</td>
                        <td style="font-weight: bold; background-color: #fff1f2;">{{ $rowOutOffline }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                @php
                    $grandInOffline = 0;
                    foreach($packageList as $pkg) {
                        $grandInOffline += $totals[$pkg]['offline'] ?? 0;
                    }
                    $grandOutOffline = $stoppedTotals['offline'] ?? 0;
                    $avgCount = max(1, count(array_filter($months, fn($m) => 
                        array_sum(array_column($m['packages'], 'offline')) + ($m['stopped']['offline'] ?? 0) > 0
                    )));
                @endphp
                <tr class="total-row">
                    <td class="month-col" style="background-color: #1e293b; color: #ffffff;">Total</td>
                    @foreach($packageList as $pkg)
                        <td>{{ $totals[$pkg]['offline'] ?? 0 }}</td>
                    @endforeach
                    <td style="color: #93c5fd;">{{ $grandInOffline }}</td>
                    <td style="color: #fca5a5;">{{ $grandOutOffline }}</td>
                </tr>
                <tr class="avg-row">
                    <td class="month-col" style="background-color: #334155; color: #f8fafc;">Average</td>
                    @foreach($packageList as $pkg)
                        <td>{{ round(($totals[$pkg]['offline'] ?? 0) / $avgCount, 1) }}</td>
                    @endforeach
                    <td style="color: #93c5fd;">{{ round($grandInOffline / $avgCount, 1) }}</td>
                    <td style="color: #fca5a5;">{{ round($grandOutOffline / $avgCount, 1) }}</td>
                </tr>
            </tfoot>
        </table>

    @elseif($modeFilter === 'online')
        {{-- ═══════════════════════════════════════════════════════════════════
             3. KONDISI FILTER: ONLINE ONLY
        ═══════════════════════════════════════════════════════════════════ --}}
        @php $totalCols = count($packageList) + 3; @endphp
        <table>
            <thead>
                <tr>
                    <th colspan="{{ $totalCols }}" class="title-header-single" style="background-color: #e0e7ff; color: #3730a3; border-color: #818cf8;">
                        Data Siswa In Online
                    </th>
                </tr>
                <tr>
                    <th class="month-header">Month</th>
                    @foreach($packageList as $pkg)
                        <th>{{ $pkg }}</th>
                    @endforeach
                    <th style="background-color: #bfdbfe; color: #1e3a8a;">Siswa In Total</th>
                    <th style="background-color: #fecdd3; color: #881337;">Siswa Out</th>
                </tr>
            </thead>
            <tbody>
                @foreach($months as $m)
                    @php
                        $rowInOnline = 0;
                        foreach($packageList as $pkg) {
                            $rowInOnline += $m['packages'][$pkg]['online'] ?? 0;
                        }
                        $rowOutOnline = $m['stopped']['online'] ?? 0;
                    @endphp
                    <tr>
                        <td class="month-col">{{ $m['label'] }}</td>
                        @foreach($packageList as $pkg)
                            @php $val = $m['packages'][$pkg]['online'] ?? 0; @endphp
                            <td class="{{ $val == 0 ? 'empty-cell' : '' }}">{{ $val }}</td>
                        @endforeach
                        <td style="font-weight: bold; background-color: #eff6ff;">{{ $rowInOnline }}</td>
                        <td style="font-weight: bold; background-color: #fff1f2;">{{ $rowOutOnline }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                @php
                    $grandInOnline = 0;
                    foreach($packageList as $pkg) {
                        $grandInOnline += $totals[$pkg]['online'] ?? 0;
                    }
                    $grandOutOnline = $stoppedTotals['online'] ?? 0;
                    $avgCountOnline = max(1, count(array_filter($months, fn($m) => 
                        array_sum(array_column($m['packages'], 'online')) + ($m['stopped']['online'] ?? 0) > 0
                    )));
                @endphp
                <tr class="total-row">
                    <td class="month-col" style="background-color: #1e293b; color: #ffffff;">Total</td>
                    @foreach($packageList as $pkg)
                        <td>{{ $totals[$pkg]['online'] ?? 0 }}</td>
                    @endforeach
                    <td style="color: #93c5fd;">{{ $grandInOnline }}</td>
                    <td style="color: #fca5a5;">{{ $grandOutOnline }}</td>
                </tr>
                <tr class="avg-row">
                    <td class="month-col" style="background-color: #334155; color: #f8fafc;">Average</td>
                    @foreach($packageList as $pkg)
                        <td>{{ round(($totals[$pkg]['online'] ?? 0) / $avgCountOnline, 1) }}</td>
                    @endforeach
                    <td style="color: #93c5fd;">{{ round($grandInOnline / $avgCountOnline, 1) }}</td>
                    <td style="color: #fca5a5;">{{ round($grandOutOnline / $avgCountOnline, 1) }}</td>
                </tr>
            </tfoot>
        </table>
    @endif

</body>
</html>
