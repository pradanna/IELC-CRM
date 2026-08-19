<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>STUDENT NUMBERS MATRIX {{ $year }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 12mm;
        }

        body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            font-size: 11px;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 10px;
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

        .no-print button {
            background: #e11d48;
            color: white;
            border: none;
            padding: 8px 18px;
            border-radius: 20px;
            font-weight: bold;
            cursor: pointer;
            font-size: 12px;
        }

        .grid-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: flex-start;
        }

        .matrix-box {
            flex: 1;
            min-width: 45%;
            margin-bottom: 25px;
        }

        table.matrix-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
            font-size: 10px;
        }

        table.matrix-table th.title-header {
            background-color: #ffffff;
            font-weight: bold;
            font-size: 12px;
            text-align: center;
            padding: 6px;
            border-bottom: 2px solid #000;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        table.matrix-table th.col-header {
            background-color: #d1d5db;
            font-weight: bold;
            text-align: center;
            padding: 4px;
            border: 1px solid #000;
            font-size: 10px;
        }

        table.matrix-table td {
            padding: 4px 6px;
            border: 1px dashed #6b7280;
            text-align: center;
        }

        table.matrix-table td.month-cell {
            text-align: left;
            font-weight: normal;
        }

        table.matrix-table tr.summary-row td {
            background-color: #9ca3af;
            font-weight: bold;
            border: 1px solid #000;
        }

        @media print {
            .no-print {
                display: none !important;
            }
            body {
                padding: 0;
            }
        }
    </style>
</head>
<body>

    <div style="margin-bottom: 15px;">
        <strong style="font-size: 14px;">Laporan Rekapitulasi Jumlah Siswa Per Cabang ({{ $year }})</strong>
        <div style="font-size: 11px; color: #64748b;">Dibuat pada {{ date('d M Y H:i') }}</div>
    </div>

    <div class="grid-container">
        @foreach($matrixData as $branch)
            <div class="matrix-box">
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
                            <th class="col-header">Total</th>
                            <th class="col-header">In Active</th>
                            <th class="col-header">Total Students</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($branch['months'] as $m => $data)
                            <tr>
                                <td class="month-cell">{{ $data['month_name'] }}</td>
                                @if(!empty($data['is_empty']))
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td style="font-weight: bold;">0</td>
                                @else
                                    <td>{{ $data['group'] }}</td>
                                    <td>{{ $data['private'] }}</td>
                                    <td>{{ $data['ielts'] }}</td>
                                    <td>{{ $data['toefl'] }}</td>
                                    <td>{{ $data['total_active'] }}</td>
                                    <td>{{ $data['inactive'] }}</td>
                                    <td style="font-weight: bold;">{{ $data['total_students'] }}</td>
                                @endif
                            </tr>
                        @endforeach

                        <!-- Total Row -->
                        <tr class="summary-row">
                            <td class="month-cell">Total</td>
                            <td>{{ $branch['totals']['group'] }}</td>
                            <td>{{ $branch['totals']['private'] }}</td>
                            <td>{{ $branch['totals']['ielts'] }}</td>
                            <td>{{ $branch['totals']['toefl'] }}</td>
                            <td>{{ $branch['totals']['total_active'] }}</td>
                            <td>{{ $branch['totals']['inactive'] }}</td>
                            <td>{{ $branch['totals']['total_students'] }}</td>
                        </tr>

                        <!-- Average Row -->
                        <tr class="summary-row">
                            <td class="month-cell">Average</td>
                            <td>{{ $branch['averages']['group'] }}</td>
                            <td>{{ $branch['averages']['private'] }}</td>
                            <td>{{ $branch['averages']['ielts'] }}</td>
                            <td>{{ $branch['averages']['toefl'] }}</td>
                            <td>{{ $branch['averages']['total_active'] }}</td>
                            <td>{{ $branch['averages']['inactive'] }}</td>
                            <td>{{ $branch['averages']['total_students'] }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        @endforeach
    </div>
</body>
</html>
