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
            <td style="width: 55%;">
                <img src="{{ public_path('assets/images/local/logo-full.png') }}" class="logo" alt="IELC Logo">
                <div style="margin-top: 6px; font-size: 11px; color: #4b5563; line-height: 1.4;">
                    <strong>Interactive English Language Center</strong><br>
                    Jl. Haryo Panular No. 48 SURAKARTA JAWA TENGAH 57149 INDONESIA
                </div>
            </td>
            <td style="width: 45%;" class="text-right">
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
                    <td>{!! nl2br(e($item->name)) !!}</td>
                    <td class="text-right">{{ $item->quantity }}</td>
                    <td class="text-right">Rp {{ number_format($item->unit_price, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            @if($invoice->discount_amount > 0)
                <tr>
                    <td colspan="4" class="text-right" style="color: #6b7280; font-size: 12px; font-weight: normal; border: none;">Subtotal</td>
                    <td class="text-right" style="color: #6b7280; font-size: 12px; font-weight: normal; border: none;">Rp {{ number_format($invoice->total_amount + $invoice->discount_amount, 0, ',', '.') }}</td>
                </tr>
                @php
                    $discountLines = collect(explode("\n", $invoice->discount_breakdown ?? ''))
                        ->map(fn($line) => trim($line))
                        ->filter(fn($line) => strlen($line) > 0);
                @endphp

                @if($discountLines->isNotEmpty())
                    @foreach($discountLines as $line)
                        @php
                            $parts = explode(':', $line, 2);
                            $label = trim($parts[0]);
                            $valStr = isset($parts[1]) ? trim($parts[1]) : '';
                        @endphp
                        <tr>
                            <td colspan="4" class="text-right" style="color: #dc2626; font-size: 12px; font-weight: normal; border: none;">{{ $label }}</td>
                            <td class="text-right" style="color: #dc2626; font-size: 12px; font-weight: normal; border: none;">
                                @if(str_contains($valStr, 'Rp'))
                                    -{{ $valStr }}
                                @else
                                    -Rp {{ number_format($invoice->discount_amount, 0, ',', '.') }}
                                @endif
                            </td>
                        </tr>
                    @endforeach
                @else
                    <tr>
                        <td colspan="4" class="text-right" style="color: #dc2626; font-size: 12px; font-weight: normal; border: none;">Total Diskon</td>
                        <td class="text-right" style="color: #dc2626; font-size: 12px; font-weight: normal; border: none;">-Rp {{ number_format($invoice->discount_amount, 0, ',', '.') }}</td>
                    </tr>
                @endif
            @endif
            <tr class="total-row">
                <td colspan="4" class="text-right">Total Tagihan</td>
                <td class="text-right">Rp {{ number_format($invoice->total_amount, 0, ',', '.') }}</td>
            </tr>
        </tfoot>
    </table>


    @if($invoice->discount_breakdown && str_contains($invoice->discount_breakdown, 'Akan mendapatkan voucher (20)'))
        <div style="margin-top: 25px; padding: 15px; background-color: #f0fdf4; border-radius: 12px; border: 1.5px dashed #16a34a;">
            <strong style="color: #14532d; font-size: 11px; text-transform: uppercase; tracking-wider">Loyalty Promo:</strong>
            <p style="margin: 6px 0 0 0; color: #166534; font-size: 12px; font-weight: bold; line-height: 1.5;">
                Apabila dibayarkan sebelum tanggal jatuh tempo, Akan mendapatkan voucher (20)
            </p>
        </div>
    @endif

    <div style="margin-top: 50px;">
        <p>Terima kasih atas kepercayaan Anda.</p>
        <p><em>Invoice ini di-generate otomatis oleh sistem dan sah tanpa tanda tangan.</em></p>
    </div>
</body>

</html>
