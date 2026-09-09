<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Keuangan Summary - {{ $periodLabel }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; font-size: 10px; }
        .header { border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 15px; }
        .logo { font-size: 20px; font-weight: bold; color: #ef4444; }
        .title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 2px; }
        .meta { color: #555; font-size: 9.5px; margin-top: 2px; }
        
        .filter-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 15px; font-size: 9px; }
        .filter-item { display: inline-block; margin-right: 15px; margin-bottom: 3px; }
        .filter-label { color: #64748b; font-weight: bold; text-transform: uppercase; }
        .filter-val { color: #0f172a; font-weight: bold; }

        .section-title { font-size: 11.5px; font-weight: bold; color: #111; border-left: 4px solid #ef4444; padding-left: 8px; margin: 15px 0 8px 0; background: #fef2f2; padding-top: 3px; padding-bottom: 3px; }
        
        .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; text-align: center; }
        .kpi-label { font-size: 8.5px; text-transform: uppercase; color: #64748b; font-weight: bold; }
        .kpi-value { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 2px; }

        table.data-table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 15px; }
        table.data-table th { background: #f1f5f9; text-align: left; padding: 6px; font-size: 8.5px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
        table.data-table td { padding: 6px; border-bottom: 1px solid #f1f5f9; font-size: 9.5px; }

        .footer { position: fixed; bottom: 0; width: 100%; font-size: 8px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 6px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-emerald { color: #059669; }
    </style>
</head>
<body>
    <div class="header">
        <table style="width: 100%; border: none;">
            <tr style="border: none;">
                <td style="border: none; padding: 0;">
                    <div class="logo">IELC CRM</div>
                    <div class="title">Laporan Keuangan Summary</div>
                </td>
                <td style="border: none; padding: 0; text-align: right; vertical-align: top;">
                    <div class="meta"><strong>Dicetak pada:</strong> {{ now()->translatedFormat('d F Y H:i') }}</div>
                    <div class="meta"><strong>Periode:</strong> {{ $periodLabel }}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Active Filters Box -->
    <div class="filter-box">
        <div style="font-weight: bold; color: #ef4444; text-transform: uppercase; font-size: 8.5px; margin-bottom: 4px;">Filter Terpilih:</div>
        <div class="filter-item"><span class="filter-label">Cabang:</span> <span class="filter-val">{{ $branchName }}</span></div>
        <div class="filter-item"><span class="filter-label">Periode:</span> <span class="filter-val">{{ $periodLabel }}</span></div>
        <div class="filter-item"><span class="filter-label">Tipe Transaksi:</span> <span class="filter-val">{{ $typeName }}</span></div>
        <div class="filter-item"><span class="filter-label">Kelas:</span> <span class="filter-val">{{ $className }}</span></div>
        <div class="filter-item"><span class="filter-label">Paket Harga:</span> <span class="filter-val">{{ $priceMasterName }}</span></div>
        <div class="filter-item"><span class="filter-label">Type Lead:</span> <span class="filter-val">{{ $leadTypeName }}</span></div>
    </div>

    <!-- KPI Summary Section -->
    <div class="section-title">Ringkasan Kinerja Keuangan ({{ $periodLabel }})</div>
    <table class="kpi-table">
        <tr>
            <td class="kpi-card" style="width: 25%;">
                <div class="kpi-label">Total Pendapatan</div>
                <div class="kpi-value text-emerald">Rp {{ number_format($stats['total_revenue'], 0, ',', '.') }}</div>
            </td>
            <td class="kpi-card" style="width: 25%;">
                <div class="kpi-label">Piutang (Pending)</div>
                <div class="kpi-value" style="color: #d97706;">Rp {{ number_format($stats['total_pending'], 0, ',', '.') }}</div>
            </td>
            <td class="kpi-card" style="width: 25%;">
                <div class="kpi-label">Total Diskon</div>
                <div class="kpi-value" style="color: #e11d48;">Rp {{ number_format($stats['total_discount'], 0, ',', '.') }}</div>
            </td>
            <td class="kpi-card" style="width: 25%;">
                <div class="kpi-label">Rata-rata Invoice</div>
                <div class="kpi-value" style="color: #7c3aed;">Rp {{ number_format($stats['average_order_value'], 0, ',', '.') }}</div>
            </td>
        </tr>
    </table>

    <!-- Breakdown Tipe Pendaftaran -->
    <div class="section-title">Breakdown Pendapatan Berdasarkan Tipe Pendaftaran</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Tipe Pendaftaran</th>
                <th class="text-right">Total Pendapatan</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>New Join Student</strong></td>
                <td class="text-right font-bold text-emerald">Rp {{ number_format($stats['new_join_revenue'], 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td><strong>Rejoin Student</strong></td>
                <td class="text-right font-bold text-emerald">Rp {{ number_format($stats['rejoin_revenue'], 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td><strong>Paket Lanjut</strong></td>
                <td class="text-right font-bold text-emerald">Rp {{ number_format($stats['paket_lanjut_revenue'] ?? 0, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <!-- Breakdown Paket Harga -->
    @if(isset($stats['price_master_revenue']) && count($stats['price_master_revenue']) > 0)
        <div class="section-title">Breakdown Pendapatan Berdasarkan Paket Harga</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 50%;">Nama Paket Harga</th>
                    <th style="width: 25%; text-align: center;">Jumlah Invoice</th>
                    <th style="width: 25%; text-align: right;">Total Pendapatan</th>
                </tr>
            </thead>
            <tbody>
                @foreach($stats['price_master_revenue'] as $pmItem)
                    <tr>
                        <td class="font-bold">{{ $pmItem['name'] }}</td>
                        <td class="text-center">{{ $pmItem['count'] }}</td>
                        <td class="text-right font-bold text-emerald">Rp {{ number_format($pmItem['total'], 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <!-- Breakdown Akun / Metode Pembayaran (Kas & Bank) -->
    @if(isset($stats['payment_method_revenue']) && count($stats['payment_method_revenue']) > 0)
        <div class="section-title">Rekapitulasi Akun Pembayaran (Kas &amp; Bank)</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 50%;">Metode / Akun Pembayaran</th>
                    <th style="width: 25%; text-align: center;">Jumlah Transaksi</th>
                    <th style="width: 25%; text-align: right;">Total Penerimaan</th>
                </tr>
            </thead>
            <tbody>
                @foreach($stats['payment_method_revenue'] as $payItem)
                    <tr>
                        <td class="font-bold">{{ $payItem['payment_method'] }}</td>
                        <td class="text-center">{{ $payItem['count'] }}</td>
                        <td class="text-right font-bold text-emerald">Rp {{ number_format($payItem['total'], 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <!-- Rincian Transaksi Lunas Dalam Periode Filter -->
    <div class="section-title">Daftar Transaksi Lunas Terfilter dalam Periode</div>
    @if(isset($stats['period_invoices']) && count($stats['period_invoices']) > 0)
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 17%;">No. Invoice</th>
                    <th style="width: 20%;">Pelanggan</th>
                    <th style="width: 16%;">Type Lead</th>
                    <th style="width: 18%;">Kelas / Paket</th>
                    <th style="width: 14%;">Metode</th>
                    <th style="width: 15%; text-align: right;">Nominal</th>
                </tr>
            </thead>
            <tbody>
                @foreach($stats['period_invoices'] as $inv)
                    @php
                        $leadObj = $inv->lead ?? ($inv->student->lead ?? null);
                        $ltName = $leadObj && $leadObj->leadType ? $leadObj->leadType->name : '-';
                    @endphp
                    <tr>
                        <td class="font-bold">{{ $inv->invoice_number }}</td>
                        <td>{{ $leadObj->name ?? 'Unknown' }}</td>
                        <td>{{ $ltName }}</td>
                        <td>{{ $inv->studyClass->name ?? 'Manual Item' }}</td>
                        <td><strong>{{ $inv->payment_method ?: '-' }}</strong></td>
                        <td class="text-right font-bold text-emerald">Rp {{ number_format($inv->total_amount, 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <div style="text-align: center; padding: 15px; color: #94a3b8; font-style: italic;">Belum ada transaksi lunas sesuai filter yang dipilih.</div>
    @endif

    <div class="footer">
        Dokumen ini dihasilkan secara otomatis oleh sistem IELC CRM & Keuangan.
    </div>
</body>
</html>
