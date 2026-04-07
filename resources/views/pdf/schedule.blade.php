<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Class Schedule - {{ $branch->name }}</title>
    <style>
        @page {
            margin: 1cm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9pt;
            color: #1f2937;
            margin: 0;
            padding: 0;
        }
        .header {
            margin-bottom: 20px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 18pt;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header .meta {
            margin-top: 5px;
            font-size: 10pt;
            color: #6b7280;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        th, td {
            border: 1px solid #e5e7eb;
            padding: 4px;
            text-align: center;
            vertical-align: middle;
            overflow: hidden;
            height: 40px;
        }
        th {
            background-color: #f9fafb;
            font-size: 8pt;
            font-weight: bold;
            color: #374151;
            text-transform: uppercase;
        }
        .time-col {
            width: 60px;
            background-color: #f3f4f6;
            font-weight: bold;
        }
        .class-box {
            border-radius: 4px;
            padding: 3px;
            height: 100%;
            color: white;
            position: relative;
        }
        .class-title {
            font-size: 6.5pt;
            font-weight: bold;
            line-height: 1.1;
            margin-bottom: 2px;
        }
        .class-teacher {
            font-size: 5pt;
            font-weight: bold;
            text-transform: uppercase;
            opacity: 0.9;
        }
        .indicator {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            border: 1px solid white;
        }
        .recurring { background-color: #10b981; }
        .one-off { background-color: #f43f5e; }
        
        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            font-size: 7pt;
            color: #9ca3af;
            text-align: right;
            border-top: 1px solid #f3f4f6;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Official Class Schedule</h1>
        <div class="meta">
            BRANCH: {{ strtoupper($branch->name) }} | 
            DATE: {{ $carbonDate->translatedFormat('l, d F Y') }}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th class="time-col">TIME</th>
                @foreach($rooms as $room)
                    <th>{{ $room->name }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($timeSlots as $time)
                <tr>
                    <td class="time-col">{{ $time }}</td>
                    @foreach($rooms as $room)
                        <td>
                            <div style="height: 40px; overflow: hidden;">
                                @php
                                    $timeHi = \Carbon\Carbon::parse($time)->format('H:i');
                                    $session = $sessions->first(fn($s) => $s->room_id === $room->id && \Carbon\Carbon::parse($s->start_time)->format('H:i') === $timeHi);
                                    $schedule = $schedules->first(fn($s) => $s->room_id === $room->id && \Carbon\Carbon::parse($s->start_time)->format('H:i') === $timeHi);
                                    
                                    $content = null;
                                    if ($session) {
                                        $isRecurringMatch = $schedule && $session->study_class_id === $schedule->study_class_id;
                                        // Strip branch name in parentheses
                                        $title = preg_replace('/\s*\(.*?\)\s*$/', '', $session->studyClass->name);
                                        $content = [
                                            'title' => $title,
                                            'teacher' => $session->teacher->user->name,
                                            'color' => $session->studyClass->class_color,
                                            'isRecurring' => $isRecurringMatch
                                        ];
                                    } elseif ($schedule) {
                                        // Strip branch name in parentheses
                                        $title = preg_replace('/\s*\(.*?\)\s*$/', '', $schedule->studyClass->name);
                                        $content = [
                                            'title' => $title,
                                            'teacher' => $schedule->teacher->user->name,
                                            'color' => $schedule->studyClass->class_color,
                                            'isRecurring' => true
                                        ];
                                    }
                                @endphp

                                @if($content)
                                    <div class="class-box" style="background-color: {{ $content['color'] }}">
                                        <div class="indicator {{ $content['isRecurring'] ? 'recurring' : 'one-off' }}"></div>
                                        <div class="class-title">{{ $content['title'] }}</div>
                                        <div class="class-teacher">{{ $content['teacher'] }}</div>
                                    </div>
                                @endif
                            </div>
                        </td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Printed on: {{ now()->format('d/m/Y H:i') }} | IELC-APPS Management System
    </div>
</body>
</html>
