<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Pendapatan Harian - {{ $periodLabel }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; font-size: 11px; }
        .header { border-bottom: 2px solid #ef4444; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { font-size: 22px; font-weight: bold; color: #ef4444; }
        .title { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-top: 3px; }
        .meta { color: #666; font-size: 10px; margin-top: 3px; }
        
        .section-title { font-size: 13px; font-weight: bold; color: #111; border-left: 4px solid #ef4444; padding-left: 10px; margin: 20px 0 10px 0; background: #fef2f2; padding-top: 4px; padding-bottom: 4px; }
        
        .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; text-align: center; }
        .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: bold; }
        .kpi-value { font-size: 18px; font-weight: bold; color: #059669; margin-top: 3px; }

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
                    <div class="title">Laporan Pendapatan Hari Ini</div>
                    <div style="font-size: 12px; font-weight: bold; color: #ef4444; margin-top: 2px;">Tanggal: {{ $periodLabel }}</div>
                </td>
                <td style="border: none; padding: 0; text-align: right; vertical-align: top;">
                    <div class="meta"><strong>Cabang:</strong> {{ $branchName }}</div>
                    <div class="meta"><strong>Dicetak pada:</strong> {{ now()->translatedFormat('d F Y H:i') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Summary Box -->
    <table class="kpi-table">
        <tr>
            <td class="kpi-card" style="background: #ecfdf5; border-color: #a7f3d0;">
                <div class="kpi-label" style="color: #047857;">Total Pendapatan Harian (Lunas)</div>
                <div class="kpi-value text-emerald">Rp {{ number_format($stats['today_revenue'], 0, ',', '.') }}</div>
                <div style="font-size: 9px; color: #065f46; margin-top: 3px;">{{ count($stats['today_invoices']) }} Transaksi Lunas</div>
            </td>
        </tr>
    </table>

    <!-- Table List Pembayaran -->
    <div class="section-title">Daftar Transaksi Lunas Harian</div>
    @if(count($stats['today_invoices']) > 0)
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 18%;">No. Invoice</th>
                    <th style="width: 12%;">Tipe</th>
                    <th style="width: 25%;">Pelanggan / No HP</th>
                    <th style="width: 25%;">Kelas / Produk</th>
                    <th style="width: 12%; text-align: right;">Nominal</th>
                    <th style="width: 8%; text-align: center;">Waktu</th>
                </tr>
            </thead>
            <tbody>
                @foreach($stats['today_invoices'] as $inv)
                    @php
                        $cust = $inv->lead->name ?? ($inv->student->lead->name ?? 'Unknown');
                        $phone = $inv->lead->phone ?? ($inv->student->lead->phone ?? '-');
                        $typeLabel = $inv->type === 'new_join' ? 'New Join' : ($inv->type === 'rejoin' ? 'Rejoin' : 'Placement Test');
                    @endphp
                    <tr>
                        <td class="font-bold">{{ $inv->invoice_number }}</td>
                        <td>{{ $typeLabel }}</td>
                        <td>{{ $cust }} <br><span style="color: #64748b; font-size: 8px;">{{ $phone }}</span></td>
                        <td>{{ $inv->studyClass->name ?? 'Manual Item' }}</td>
                        <td class="text-right font-bold text-emerald">Rp {{ number_format($inv->total_amount, 0, ',', '.') }}</td>
                        <td class="text-center">{{ $inv->paid_at ? \Carbon\Carbon::parse($inv->paid_at)->format('H:i') : \Carbon\Carbon::parse($inv->updated_at)->format('H:i') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <div style="text-align: center; padding: 20px; color: #94a3b8; font-style: italic;">Belum ada pembayaran lunas yang masuk pada tanggal ini.</div>
    @endif

    <div class="footer">
        Dokumen ini dihasilkan secara otomatis oleh sistem IELC CRM & Keuangan.
    </div>
</body>
</html>
