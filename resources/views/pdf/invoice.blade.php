<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        body {
            font-family: sans-serif;
            font-size: 14px;
            color: #333;
        }

        .header {
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
        }

        .logo {
            max-width: 200px;
        }

        .company-info {
            float: right;
            text-align: right;
        }

        .invoice-title {
            font-size: 24px;
            font-weight: bold;
            color: #111;
            margin-bottom: 5px;
        }

        .details-table {
            width: 100%;
            margin-bottom: 30px;
        }

        .details-table td {
            vertical-align: top;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .items-table th,
        .items-table td {
            padding: 12px;
            border: 1px solid #e5e7eb;
            text-align: left;
        }

        .items-table th {
            background-color: #f9fafb;
            font-weight: bold;
        }

        .text-right {
            text-align: right !important;
        }

        .total-row th,
        .total-row td {
            font-weight: bold;
            background-color: #f9fafb;
            border-top: 2px solid #d1d5db;
        }
    </style>
</head>

<body>
    <table class="header">
        <tr>
            <td style="width: 50%;">
                <img src="{{ public_path('assets/images/local/logo-full.png') }}" class="logo" alt="IELC Logo">
            </td>
            <td style="width: 50%;" class="text-right">
                <div class="invoice-title">INVOICE</div>
                <div>No: {{ $invoice->invoice_number }}</div>
                <div>Tanggal: {{ $invoice->created_at->format('d M Y') }}</div>
                <div>Jatuh Tempo: {{ \Carbon\Carbon::parse($invoice->due_date)->format('d M Y') }}</div>
            </td>
        </tr>
    </table>

    <!-- Indikator Status Lunas / Belum Lunas -->
    @if ($invoice->status === 'paid')
        <div
            style="position: absolute; top: 40px; right: 40px; border: 4px solid #16a34a; color: #16a34a; padding: 10px 20px; font-size: 28px; font-weight: bold; font-family: sans-serif; text-transform: uppercase; transform: rotate(-15deg); border-radius: 10px; opacity: 0.7;">
            LUNAS
        </div>
        <div style="margin-top: 10px; font-size: 14px; color: #16a34a;">
            <strong>Dibayar pada:</strong> {{ \Carbon\Carbon::parse($invoice->paid_at)->translatedFormat('d F Y H:i') }}
        </div>
    @elseif($invoice->status === 'unpaid')
        {{-- <div
            style="position: absolute; top: 40px; right: 40px; border: 4px solid #dc2626; color: #dc2626; padding: 10px 20px; font-size: 28px; font-weight: bold; font-family: sans-serif; text-transform: uppercase; transform: rotate(-15deg); border-radius: 10px; opacity: 0.7;">
            BELUM LUNAS
        </div> --}}
    @endif


    <table class="details-table">
        <tr>
            <td style="width: 50%;">
                <strong>Ditagihkan kepada:</strong><br>
                {{ $invoice->lead->name ?? 'Siswa' }}<br>
                {{ $invoice->lead->phone ?? '' }}<br>
                {{ $invoice->lead->address ?? '' }}
            </td>
            <td style="width: 50%;" class="text-right">
                <strong>Dibayarkan kepada:</strong><br>
                IELC English Campus<br>
                Bank BCA - 1234567890<br>
                a/n IELC English Campus
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th>No.</th>
                <th>Deskripsi</th>
                <th class="text-right">Jumlah</th>
                <th class="text-right">Harga Satuan</th>
                <th class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice->items as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item->name }}</td>
                    <td class="text-right">{{ $item->quantity }}</td>
                    <td class="text-right">Rp {{ number_format($item->unit_price, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="4" class="text-right">Total Tagihan</td>
                <td class="text-right">Rp {{ number_format($invoice->total_amount, 0, ',', '.') }}</td>
            </tr>
        </tfoot>
    </table>

    <div style="margin-top: 50px;">
        <p>Terima kasih atas kepercayaan Anda.</p>
        <p><em>Invoice ini di-generate otomatis oleh sistem dan sah tanpa tanda tangan.</em></p>
    </div>
</body>

</html>
