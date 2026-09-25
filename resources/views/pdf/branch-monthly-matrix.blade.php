<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>STUDENT NUMBERS MATRIX {{ $year }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 12mm 15mm;
        }

        body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            font-size: 11px;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
        }

        .no-print {
            margin-bottom: 15px;
            padding: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .page-container {
            page-break-after: always;
            break-after: page;
            margin-bottom: 20px;
        }

        .page-container:last-child {
            page-break-after: avoid;
            break-after: avoid;
            margin-bottom: 0;
        }

        .report-header {
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 8px;
        }

        table.matrix-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
            font-size: 10.5px;
        }

        table.matrix-table th.title-header {
            background-color: #ffffff;
            font-weight: bold;
            font-size: 13px;
            text-align: center;
            padding: 8px;
            border-bottom: 2px solid #000;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        table.matrix-table th.col-header {
            background-color: #d1d5db;
            font-weight: bold;
            text-align: center;
            padding: 6px 4px;
            border: 1px solid #000;
            font-size: 10.5px;
        }

        table.matrix-table td {
            padding: 5px 8px;
            border: 1px dashed #6b7280;
            text-align: center;
        }

        table.matrix-table td.month-cell {
            text-align: left;
            font-weight: 500;
        }

        table.matrix-table tr.summary-row td {
            background-color: #9ca3af;
            font-weight: bold;
            border: 1px solid #000;
            padding: 6px 8px;
        }

        @media print {
            .no-print {
                display: none !important;
            }
            .page-container {
                page-break-after: always;
                break-after: page;
            }
            .page-container:last-child {
                page-break-after: avoid;
                break-after: avoid;
            }
        }
    </style>
</head>
<body>

    @foreach($matrixData as $branch)
        <div class="page-container">
            <div class="report-header">
                <div>
                    <strong style="font-size: 13px;">Laporan Rekapitulasi Jumlah Siswa Per Cabang ({{ $year }})</strong>
                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Cabang: {{ strtoupper($branch['branch_name']) }} | Dibuat pada {{ date('d M Y H:i') }}</div>
                </div>
            </div>

            <table class="matrix-table">
                <thead>
                    <tr>
                        <th colspan="8" class="title-header">
                            STUDENT NUMBERS {{ strtoupper($branch['branch_name']) }} {{ $branch['year'] }}
                        </th>
                    </tr>
                    <tr>
                        <th class="col-header" style="width: 18%;">Month</th>
                        <th class="col-header">Group</th>
                        <th class="col-header">Private</th>
                        <th class="col-header">IELTS</th>
                        <th class="col-header">TOEFL</th>
                        <th class="col-header">In Active</th>
                        <th class="col-header">Total</th>
                        <th class="col-header" style="font-weight: bold; background-color: #cbd5e1;">Total Student Active</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($branch['months'] as $m => $data)
                        <tr>
                            <td class="month-cell">{{ $data['month_name'] }}</td>
                            @if(!empty($data['is_empty']))
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td style="font-weight: bold; color: #94a3b8;">-</td>
                            @else
                                <td>{{ $data['group'] }}</td>
                                <td>{{ $data['private'] }}</td>
                                <td>{{ $data['ielts'] }}</td>
                                <td>{{ $data['toefl'] }}</td>
                                <td>{{ $data['inactive'] }}</td>
                                <td>{{ $data['total_students'] }}</td>
                                <td style="font-weight: bold;">{{ $data['total_active'] }}</td>
                            @endif
                        </tr>
                    @endforeach

                    <!-- Average Row -->
                    <tr class="summary-row">
                        <td class="month-cell">Average</td>
                        <td>{{ $branch['averages']['group'] }}</td>
                        <td>{{ $branch['averages']['private'] }}</td>
                        <td>{{ $branch['averages']['ielts'] }}</td>
                        <td>{{ $branch['averages']['toefl'] }}</td>
                        <td>{{ $branch['averages']['inactive'] }}</td>
                        <td>{{ $branch['averages']['total_students'] }}</td>
                        <td style="font-weight: 800;">{{ $branch['averages']['total_active'] }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    @endforeach
</body>
</html>
