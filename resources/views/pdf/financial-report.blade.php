<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Keuangan - {{ $periodLabel }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; font-size: 11px; }
        .header { border-bottom: 2px solid #ef4444; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { font-size: 22px; font-weight: bold; color: #ef4444; }
        .title { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-top: 3px; }
        .meta { color: #666; font-size: 10px; margin-top: 3px; }
        
        .section-title { font-size: 13px; font-weight: bold; color: #111; border-left: 4px solid #ef4444; padding-left: 10px; margin: 20px 0 10px 0; background: #fef2f2; padding-top: 4px; padding-bottom: 4px; }
        
        .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; text-align: center; }
        .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: bold; }
        .kpi-value { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 3px; }

        table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.data-table th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 9px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
        table.data-table td { padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 10px; }

        .footer { position: fixed; bottom: 0; width: 100%; font-size: 8px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
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
                    <div class="title">Laporan Keuangan & Pendapatan</div>
                </td>
                <td style="border: none; padding: 0; text-align: right; vertical-align: top;">
                    <div class="meta"><strong>Cabang:</strong> {{ $branchName }}</div>
                    <div class="meta"><strong>Periode:</strong> {{ $periodLabel }}</div>
                    <div class="meta"><strong>Dicetak pada:</strong> {{ now()->translatedFormat('d F Y H:i') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- KPI Summary Section -->
    <div class="section-title">Ringkasan Kinerja Keuangan ({{ $periodLabel }})</div>
    <table class="kpi-table">
        <tr>
            <td class="kpi-card" style="width: 25%;">
                <div class="kpi-label">Total Pendapatan (Lunas)</div>
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

    <!-- Daily & Month To Date Highlights -->
    <table class="kpi-table" style="margin-top: 10px;">
        <tr>
            <td class="kpi-card" style="width: 50%; background: #ecfdf5; border-color: #a7f3d0;">
                <div class="kpi-label" style="color: #047857;">Pendapatan Hari Ini ({{ now()->translatedFormat('d F Y') }})</div>
                <div class="kpi-value text-emerald" style="font-size: 18px;">Rp {{ number_format($stats['today_revenue'], 0, ',', '.') }}</div>
                <div style="font-size: 9px; color: #065f46; margin-top: 3px;">{{ count($stats['today_invoices']) }} Transaksi Lunas</div>
            </td>
            <td class="kpi-card" style="width: 50%; background: #f8fafc; border-color: #cbd5e1;">
                <div class="kpi-label">Pendapatan Bulan Ini So Far (1 - {{ now()->translatedFormat('d F Y') }})</div>
                <div class="kpi-value" style="font-size: 18px;">Rp {{ number_format($stats['mtd_revenue'], 0, ',', '.') }}</div>
                <div style="font-size: 9px; color: #64748b; margin-top: 3px;">Akumulasi Berjalan</div>
            </td>
        </tr>
    </table>

    <!-- Rincian Transaksi Lunas Hari Ini -->
    <div class="section-title">Rincian Pembayaran Lunas Hari Ini ({{ now()->translatedFormat('d F Y') }})</div>
    @if(count($stats['today_invoices']) > 0)
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 20%;">No. Invoice</th>
                    <th style="width: 25%;">Pelanggan</th>
                    <th style="width: 30%;">Kelas / Produk</th>
                    <th style="width: 15%; text-align: right;">Nominal</th>
                    <th style="width: 10%; text-align: center;">Waktu</th>
                </tr>
            </thead>
            <tbody>
                @foreach($stats['today_invoices'] as $inv)
                    <tr>
                        <td class="font-bold">{{ $inv->invoice_number }}</td>
                        <td>{{ $inv->lead->name ?? ($inv->student->lead->name ?? 'Unknown') }}</td>
                        <td>{{ $inv->studyClass->name ?? 'Manual Item' }}</td>
                        <td class="text-right font-bold text-emerald">Rp {{ number_format($inv->total_amount, 0, ',', '.') }}</td>
                        <td class="text-center">{{ $inv->paid_at ? \Carbon\Carbon::parse($inv->paid_at)->format('H:i') : '-' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <div style="text-align: center; padding: 15px; color: #94a3b8; font-style: italic;">Belum ada pembayaran lunas yang masuk hari ini.</div>
    @endif

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
                <td class="text-right font-bold">Rp {{ number_format($stats['new_join_revenue'], 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td><strong>Rejoin Student</strong></td>
                <td class="text-right font-bold">Rp {{ number_format($stats['rejoin_revenue'], 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        Dokumen ini dihasilkan secara otomatis oleh sistem IELC CRM & Keuangan. Halaman 1 dari 1
    </div>
</body>
</html>
