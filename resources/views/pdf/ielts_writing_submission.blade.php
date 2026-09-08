<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>IELTS Writing Submission - {{ $session->lead?->name ?? 'Candidate' }}</title>
    <style>
        @page {
            margin: 25mm 20mm 20mm 20mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            font-size: 13px;
            line-height: 1.6;
        }
        .header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .logo-text {
            font-size: 22px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.5px;
        }
        .logo-sub {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #64748b;
            font-weight: bold;
        }
        .doc-title {
            text-align: right;
            font-size: 16px;
            font-weight: 800;
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .doc-date {
            text-align: right;
            font-size: 11px;
            color: #64748b;
        }
        .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 25px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 4px 6px;
            font-size: 12px;
        }
        .label {
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 10px;
            width: 18%;
        }
        .value {
            color: #0f172a;
            font-weight: 600;
            width: 32%;
        }
        .task-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .task-header {
            background-color: #0f172a;
            color: #ffffff;
            padding: 10px 14px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 12px;
        }
        .task-meta {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 12px;
            padding-left: 4px;
        }
        .task-badge {
            background-color: #e0f2fe;
            color: #0369a1;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 10px;
            display: inline-block;
            margin-right: 8px;
            text-transform: uppercase;
        }
        .essay-box {
            background-color: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 16px;
            min-height: 120px;
            font-size: 12.5px;
            line-height: 1.7;
            color: #334155;
            white-space: pre-wrap;
        }
        .empty-notice {
            color: #94a3b8;
            font-style: italic;
            padding: 20px;
            text-align: center;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 8px;
        }
        .rubric-box {
            margin-top: 15px;
            border: 1px dashed #cbd5e1;
            background-color: #fafafa;
            border-radius: 6px;
            padding: 10px 14px;
        }
        .rubric-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #475569;
            margin-bottom: 6px;
        }
        .rubric-grid {
            width: 100%;
            border-collapse: collapse;
        }
        .rubric-grid td {
            width: 25%;
            font-size: 11px;
            padding: 4px;
            color: #64748b;
        }
        .score-line {
            display: inline-block;
            width: 35px;
            border-bottom: 1px solid #94a3b8;
            margin-left: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <table class="header-table">
            <tr>
                <td>
                    <div class="logo-text">IELC ACADEMIC</div>
                    <div class="logo-sub">Placement Test Writing Submission</div>
                </td>
                <td>
                    <div class="doc-title">Writing Answer Sheet</div>
                    <div class="doc-date">Submitted: {{ $session->finished_at ? \Carbon\Carbon::parse($session->finished_at)->format('d M Y, H:i') : now()->format('d M Y, H:i') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="info-card">
        <table class="info-table">
            <tr>
                <td class="label">Candidate</td>
                <td class="value">{{ $session->lead?->name ?? 'Candidate' }}</td>
                <td class="label">Exam</td>
                <td class="value">{{ $session->ptExam?->title ?? 'IELTS Placement Test' }}</td>
            </tr>
            <tr>
                <td class="label">Phone</td>
                <td class="value">{{ $session->lead?->phone ?? '-' }}</td>
                <td class="label">Session ID</td>
                <td class="value" style="font-family: monospace; font-size: 10px;">{{ substr($session->id, 0, 8) }}...</td>
            </tr>
            <tr>
                <td class="label">Target Band</td>
                <td class="value">{{ $session->lead?->target_band ?? 'N/A' }}</td>
                <td class="label">Branch</td>
                <td class="value">{{ $session->lead?->branch?->name ?? 'General' }}</td>
            </tr>
        </table>
    </div>

    @forelse($writingTasks as $index => $item)
        <div class="task-section">
            <div class="task-header">
                {{ $item['task']->title ?? ('Task ' . ($index + 1)) }}
            </div>
            
            <div class="task-meta">
                <span class="task-badge">Task {{ $index + 1 }}</span>
                <span>Word Count: <strong>{{ $item['word_count'] }}</strong> words</span>
                @if(!empty($item['task']->min_words))
                    <span>(Minimum target: {{ $item['task']->min_words }} words)</span>
                @endif
            </div>

            <div class="essay-box">@if(!empty($item['text'])){!! $item['text'] !!}@else<span class="empty-notice">(No response text entered by candidate)</span>@endif</div>

            @if(!empty($item['file_url']))
                <div style="margin-top: 10px; font-size: 11px; color: #0284c7;">
                    <strong>Attached File:</strong> {{ $item['file_url'] }}
                </div>
            @endif

            <div class="rubric-box">
                <div class="rubric-title">Examiner Marking Box</div>
                <table class="rubric-grid">
                    <tr>
                        <td>Task Achievement: <span class="score-line"></span></td>
                        <td>Coherence &amp; Cohesion: <span class="score-line"></span></td>
                        <td>Lexical Resource: <span class="score-line"></span></td>
                        <td>Grammar &amp; Accuracy: <span class="score-line"></span></td>
                    </tr>
                </table>
            </div>
        </div>
    @empty
        <div class="empty-notice">
            No writing tasks found for this session.
        </div>
    @endforelse

    <div class="footer">
        IELC Placement Test Diagnostic Report &bull; Candidate: {{ $session->lead?->name ?? 'Candidate' }} &bull; Page Generated: {{ now()->format('d M Y, H:i') }}
    </div>
</body>
</html>
