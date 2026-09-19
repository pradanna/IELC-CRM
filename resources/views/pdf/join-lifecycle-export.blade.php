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
        th.pkg-header {
            background-color: #e2e8f0;
            color: #1e293b;
            font-size: 10.5px;
            font-weight: bold;
        }
        th.sub-header-new {
            background-color: #d1fae5;
            color: #065f46;
            font-size: 9px;
            font-weight: bold;
        }
        th.sub-header-lanjut {
            background-color: #e0f2fe;
            color: #0369a1;
            font-size: 9px;
            font-weight: bold;
        }
        th.sub-header-rejoin {
            background-color: #f3e8ff;
            color: #7e22ce;
            font-size: 9px;
            font-weight: bold;
        }
        th.sub-header-total {
            background-color: #cbd5e1;
            color: #0f172a;
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
            color: #94a3b8;
            font-weight: normal;
        }
        .val-cell {
            font-weight: bold;
        }
    </style>
</head>
<body>

    <div class="header">
        <h2>{{ $title }}</h2>
        <p>Laporan Siklus Join Siswa (Baru, Paket Lanjut, Rejoin) — Tahun {{ $year }} {{ $branchName ? 'Cabang ' . $branchName . ' — ' : '' }}{{ $month ? 'Bulan ' . $month : '' }} {{ $modeFilter ? '(' . strtoupper($modeFilter) . ')' : '(SEMUA MODE)' }}</p>
    </div>

    @php
        $totalCols = (count($packageList) * 4) + 5;
    @endphp

    <table>
        <thead>
            <tr>
                <th colspan="{{ $totalCols }}" class="title-header">
                    Matriks Siklus Belajar Siswa (Baru / Paket Lanjut / Rejoin) per Paket Harga
                </th>
            </tr>
            <tr>
                <th rowspan="2" class="month-header">Bulan</th>
                @foreach($packageList as $pkg)
                    <th colspan="4" class="pkg-header">{{ $pkg }}</th>
                @endforeach
                <th colspan="4" class="pkg-header" style="background-color: #cbd5e1;">Total Gabungan</th>
            </tr>
            <tr>
                @foreach($packageList as $pkg)
                    <th class="sub-header-new">Baru</th>
                    <th class="sub-header-lanjut">Lanjut</th>
                    <th class="sub-header-rejoin">Rejoin</th>
                    <th class="sub-header-total">Total</th>
                @endforeach
                <th class="sub-header-new">Baru</th>
                <th class="sub-header-lanjut">Lanjut</th>
                <th class="sub-header-rejoin">Rejoin</th>
                <th class="sub-header-total" style="background-color: #94a3b8; color: #ffffff;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($months as $m)
                <tr>
                    <td class="month-col">{{ $m['label'] }}</td>
                    @foreach($packageList as $pkg)
                        @php
                            $pkgData = $m['packages'][$pkg] ?? ['new_join' => 0, 'paket_lanjut' => 0, 'rejoin' => 0, 'total' => 0];
                            $vNew    = $pkgData['new_join'];
                            $vLanjut = $pkgData['paket_lanjut'];
                            $vRejoin = $pkgData['rejoin'];
                            $vTot    = $pkgData['total'];
                        @endphp
                        <td class="{{ $vNew == 0 ? 'empty-cell' : 'val-cell' }}">{{ $vNew }}</td>
                        <td class="{{ $vLanjut == 0 ? 'empty-cell' : 'val-cell' }}">{{ $vLanjut }}</td>
                        <td class="{{ $vRejoin == 0 ? 'empty-cell' : 'val-cell' }}">{{ $vRejoin }}</td>
                        <td class="val-cell" style="background-color: #f1f5f9;">{{ $vTot }}</td>
                    @endforeach
                    <td class="val-cell" style="background-color: #ecfdf5; color: #065f46;">{{ $m['new_join'] }}</td>
                    <td class="val-cell" style="background-color: #f0f9ff; color: #0369a1;">{{ $m['paket_lanjut'] }}</td>
                    <td class="val-cell" style="background-color: #faf5ff; color: #7e22ce;">{{ $m['rejoin'] }}</td>
                    <td class="val-cell" style="background-color: #e2e8f0; font-weight: bold;">{{ $m['total'] }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            @php
                $avgCount = max(1, count(array_filter($months, fn($m) => ($m['total'] ?? 0) > 0)));
            @endphp
            <tr class="total-row">
                <td class="month-col" style="background-color: #1e293b; color: #ffffff;">Total</td>
                @foreach($packageList as $pkg)
                    @php
                        $tPkg = $totals['by_package'][$pkg] ?? ['new_join' => 0, 'paket_lanjut' => 0, 'rejoin' => 0, 'total' => 0];
                    @endphp
                    <td style="color: #6ee7b7;">{{ $tPkg['new_join'] }}</td>
                    <td style="color: #7dd3fc;">{{ $tPkg['paket_lanjut'] }}</td>
                    <td style="color: #d8b4fe;">{{ $tPkg['rejoin'] }}</td>
                    <td style="color: #ffffff; font-weight: bold; background-color: #334155;">{{ $tPkg['total'] }}</td>
                @endforeach
                <td style="color: #6ee7b7; font-weight: bold;">{{ $totals['new_join'] ?? 0 }}</td>
                <td style="color: #7dd3fc; font-weight: bold;">{{ $totals['paket_lanjut'] ?? 0 }}</td>
                <td style="color: #d8b4fe; font-weight: bold;">{{ $totals['rejoin'] ?? 0 }}</td>
                <td style="color: #fde047; font-weight: bold; background-color: #0f172a;">{{ $totals['total'] ?? 0 }}</td>
            </tr>
            <tr class="avg-row">
                <td class="month-col" style="background-color: #334155; color: #f8fafc;">Rata-rata</td>
                @foreach($packageList as $pkg)
                    @php
                        $tPkg = $totals['by_package'][$pkg] ?? ['new_join' => 0, 'paket_lanjut' => 0, 'rejoin' => 0, 'total' => 0];
                    @endphp
                    <td>{{ round($tPkg['new_join'] / $avgCount, 1) }}</td>
                    <td>{{ round($tPkg['paket_lanjut'] / $avgCount, 1) }}</td>
                    <td>{{ round($tPkg['rejoin'] / $avgCount, 1) }}</td>
                    <td style="font-weight: bold;">{{ round($tPkg['total'] / $avgCount, 1) }}</td>
                @endforeach
                <td>{{ round(($totals['new_join'] ?? 0) / $avgCount, 1) }}</td>
                <td>{{ round(($totals['paket_lanjut'] ?? 0) / $avgCount, 1) }}</td>
                <td>{{ round(($totals['rejoin'] ?? 0) / $avgCount, 1) }}</td>
                <td style="color: #fde047; font-weight: bold;">{{ round(($totals['total'] ?? 0) / $avgCount, 1) }}</td>
            </tr>
        </tfoot>
    </table>

</body>
</html>
