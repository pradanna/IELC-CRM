<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Progress Report - {{ $student->name }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #1f2937;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            font-size: 12px;
        }
        .container {
            padding: 20px 40px;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #ef4444;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .logo-cell {
            vertical-align: middle;
            width: 40%;
        }
        .company-info-cell {
            text-align: right;
            vertical-align: middle;
        }
        .company-name {
            font-size: 16px;
            font-weight: bold;
            color: #b91c1c;
            margin-bottom: 2px;
        }
        .company-sub {
            font-size: 10px;
            color: #6b7280;
        }
        .report-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
            color: #111827;
        }
        .info-grid {
            width: 100%;
            margin-bottom: 15px;
            border-collapse: collapse;
        }
        .info-grid td {
            padding: 4px 0;
            vertical-align: top;
            font-size: 11px;
        }
        .label {
            font-weight: bold;
            color: #4b5563;
            width: 100px;
        }
        .value {
            color: #111827;
        }
        .score-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .score-table th {
            background-color: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
            padding: 8px 12px;
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            color: #6b7280;
        }
        .score-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 11px;
        }
        .score-value {
            font-size: 14px;
            font-weight: bold;
            text-align: center;
        }
        .avg-container {
            margin-top: 15px;
            padding: 10px;
            background-color: #fef2f2;
            border: 1px solid #fee2e2;
            border-radius: 10px;
            text-align: center;
        }
        .avg-label {
            font-size: 10px;
            font-weight: bold;
            color: #991b1b;
            text-transform: uppercase;
        }
        .avg-value {
            font-size: 24px;
            font-weight: bold;
            color: #b91c1c;
        }
        .feedback-section {
            margin-top: 15px;
        }
        .feedback-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 5px;
            color: #374151;
            border-left: 3px solid #ef4444;
            padding-left: 8px;
        }
        .feedback-content {
            padding: 10px;
            background-color: #f9fafb;
            border-radius: 6px;
            font-style: italic;
            color: #4b5563;
            font-size: 11px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #9ca3af;
            border-top: 1px solid #f3f4f6;
            padding-top: 10px;
        }
        .signature-grid {
            width: 100%;
            margin-top: 40px;
        }
        .signature-box {
            text-align: center;
            width: 33%;
            font-size: 11px;
        }
        .signature-line {
            border-top: 1px solid #374151;
            width: 140px;
            margin: 40px auto 5px auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if($logoBase64)
                        <img src="data:image/png;base64,{{ $logoBase64 }}" style="max-height: 50px;">
                    @else
                        <div style="font-size: 20px; font-weight: bold; color: #b91c1c;">IELC</div>
                    @endif
                </td>
                <td class="company-info-cell">
                    <div class="company-name">IELC English Language Centre</div>
                    <div class="company-sub">Jl. Ahmad Yani No. 123, Semarang</div>
                    <div class="company-sub">Phone: (024) 844xxxx | www.ielc.co.id</div>
                </td>
            </tr>
        </table>

        <div class="report-title">Student Progress Report</div>

        <table class="info-grid">
            <tr>
                <td class="label">Student Name</td>
                <td class="value">: {{ $student->lead->name ?? ($student->name ?? '-') }}</td>
                <td class="label">NIS</td>
                <td class="value">: {{ $student->nis ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Course Level</td>
                <td class="value">: {{ $studyClass->package->level->name ?? '-' }}</td>
                <td class="label">Class Name</td>
                <td class="value">: {{ $studyClass->name }}</td>
            </tr>
            <tr>
                <td class="label">Assessment</td>
                <td class="value">: <span style="text-transform: capitalize;">{{ str_replace('_', ' ', $score->assessment_type) }}</span></td>
                <td class="label">Report Date</td>
                <td class="value">: {{ $score->created_at->format('d F Y') }}</td>
            </tr>
        </table>

        <table class="score-table">
            <thead>
                <tr>
                    <th>Skill Domain</th>
                    <th style="text-align: center; width: 100px;">Score</th>
                    <th>Interpretation</th>
                </tr>
            </thead>
            <tbody>
                @foreach($score->score_details as $skill => $val)
                <tr>
                    <td style="text-transform: capitalize; font-weight: bold; color: #374151;">{{ $skill }}</td>
                    <td class="score-value">{{ $val }}</td>
                    <td>
                        @if($val >= 100) FLUENT
                        @elseif($val >= 85) Excellent
                        @elseif($val >= 75) Good
                        @elseif($val >= 60) Satisfactory
                        @else Needs Improvement
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="avg-container">
            <div class="avg-label">Final Average Score</div>
            <div class="avg-value">{{ number_format($score->total_score, 1) }}</div>
        </div>

        @if($score->final_feedback)
        <div class="feedback-section">
            <div class="feedback-title">TEACHER'S FEEDBACK / COMMENTS</div>
            <div class="feedback-content">
                "{{ $score->final_feedback }}"
            </div>
        </div>
        @endif

        <table class="signature-grid">
            <tr>
                <td class="signature-box">
                    <div>Academic Coordinator</div>
                    <div class="signature-line"></div>
                    <div style="font-size: 9px; color: #6b7280;">(Official Stamp)</div>
                </td>
                <td class="signature-box"></td>
                <td class="signature-box">
                    <div>Class Teacher</div>
                    <div class="signature-line"></div>
                    <div>{{ auth()->user()->name }}</div>
                </td>
            </tr>
        </table>

        <div class="footer">
            Generated on {{ now()->format('d/m/Y H:i') }} • This is a computer-generated document. No signature required.
        </div>
    </div>
</body>
</html>
