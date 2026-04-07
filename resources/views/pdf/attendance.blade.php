<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Attendance Report - {{ $session->studyClass->name }}</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            color: #1a1a1a;
            font-size: 12px;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
        }
        .header {
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header table {
            width: 100%;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            letter-spacing: -1px;
        }
        .report-title {
            text-align: right;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            color: #888;
            letter-spacing: 1px;
        }
        .session-info {
            margin-bottom: 30px;
        }
        .session-info table {
            width: 100%;
            border-collapse: collapse;
        }
        .session-info td {
            vertical-align: top;
            padding: 5px 0;
        }
        .label {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: bold;
            color: #aaa;
            display: block;
            margin-bottom: 2px;
        }
        .value {
            font-size: 13px;
            font-weight: bold;
        }
        .stats-container {
            background: #fdfdfd;
            border: 1px solid #f0f0f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 30px;
        }
        .stats-table {
            width: 100%;
            text-align: center;
        }
        .stat-item {
            width: 20%;
        }
        .stat-value {
            font-size: 18px;
            font-weight: bold;
        }
        .stat-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #888;
        }
        .attendance-table {
            width: 100%;
            border-collapse: collapse;
        }
        .attendance-table th {
            background: #f9f9f9;
            text-align: left;
            padding: 10px;
            font-size: 10px;
            text-transform: uppercase;
            border-bottom: 2px solid #eee;
        }
        .attendance-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #f5f5f5;
        }
        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-present { background: #e6f6ed; color: #027a48; }
        .status-absent { background: #fef3f2; color: #b42318; }
        .status-late { background: #fff9eb; color: #b54708; }
        .status-excused { background: #f0f7ff; color: #004eeb; }
        
        .footer {
            margin-top: 50px;
            font-size: 10px;
            color: #aaa;
            text-align: center;
        }
        .topic-box {
            background: #fcfcfc;
            border-left: 4px solid #eee;
            padding: 10px 15px;
            margin-top: 10px;
            font-style: italic;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="header">
        <table>
            <tr>
                <td class="logo">IELC APPS</td>
                <td class="report-title">Attendance Class Report</td>
            </tr>
        </table>
    </div>

    <div class="session-info">
        <table style="width: 100%;">
            <tr>
                <td style="width: 40%;">
                    <span class="label">Class Name</span>
                    <span class="value">{{ $session->studyClass->name }}</span>
                    <div style="font-size: 10px; color: #666; font-weight: bold;">
                        {{ $session->studyClass->package->level->name }}
                    </div>
                </td>
                <td style="width: 30%;">
                    <span class="label">Date & Time</span>
                    <span class="value">{{ \Carbon\Carbon::parse($session->date)->format('d M Y') }}</span>
                    <div style="font-size: 10px; color: #666;">
                        {{ substr($session->start_time, 0, 5) }} - {{ substr($session->end_time, 0, 5) }}
                    </div>
                </td>
                <td style="width: 30%;">
                    <span class="label">Primary Instructor</span>
                    <span class="value">{{ $session->teacher->user->name }}</span>
                    <div style="font-size: 10px; color: #666;">
                        {{ $session->branch->name }} - {{ $session->room->name }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="stats-container">
        <table class="stats-table">
            <tr>
                <td class="stat-item">
                    <div class="stat-value">{{ $stats['total'] }}</div>
                    <div class="stat-label">Total Pupils</div>
                </td>
                <td class="stat-item">
                    <div class="stat-value" style="color: #027a48;">{{ $stats['present'] }}</div>
                    <div class="stat-label">Present</div>
                </td>
                <td class="stat-item">
                    <div class="stat-value" style="color: #b42318;">{{ $stats['absent'] }}</div>
                    <div class="stat-label">Absent</div>
                </td>
                <td class="stat-item">
                    <div class="stat-value" style="color: #b54708;">{{ $stats['late'] }}</div>
                    <div class="stat-label">Late</div>
                </td>
                <td class="stat-item">
                    <div class="stat-value" style="color: #004eeb;">{{ $stats['excused'] }}</div>
                    <div class="stat-label">Excused</div>
                </td>
            </tr>
        </table>
    </div>

    <div style="margin-bottom: 30px;">
        <span class="label">Material / Topic Covered</span>
        <div class="topic-box">
            {{ $session->topic_taught ?? 'No topic recorded for this session.' }}
        </div>
    </div>

    <table class="attendance-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 15%;">NIS</th>
                <th style="width: 30%;">Student Name</th>
                <th style="width: 15%;">Status</th>
                <th style="width: 35%;">Teacher Notes</th>
            </tr>
        </thead>
        <tbody>
            @foreach($attendances as $index => $attendance)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td style="font-family: monospace;">{{ $attendance->student->nis }}</td>
                    <td style="font-weight: bold;">{{ $attendance->student->user->name ?? $attendance->student->lead->name }}</td>
                    <td>
                        <span class="status-badge status-{{ $attendance->status }}">
                            {{ $attendance->status }}
                        </span>
                        @if($attendance->status === 'late' && $attendance->late_minutes)
                            <div style="font-size: 8px; margin-top: 2px; color: #b54708;">({{ $attendance->late_minutes }} mins)</div>
                        @endif
                    </td>
                    <td style="font-size: 11px; color: #666;">
                        {{ $attendance->teacher_notes ?? '-' }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Report generated on {{ now()->format('d M Y H:i') }} • IELC Management System
    </div>
</body>
</html>
