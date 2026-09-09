<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Candidate Answer Sheet - {{ $session->lead?->name ?? 'Candidate' }}</title>
    <style>
        @page {
            margin: 15mm 15mm 15mm 15mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0f172a;
            font-size: 12px;
            line-height: 1.5;
        }
        .header {
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #0f172a;
        }
        .candidate-name {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 3px;
        }
        .meta-info {
            font-size: 11px;
            color: #64748b;
        }
        .section-header {
            margin-top: 22px;
            margin-bottom: 10px;
            padding: 8px 12px;
            background-color: #f1f5f9;
            border-left: 4px solid #0284c7;
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section-meta {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 10px;
            padding-left: 12px;
        }
        .summary-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 11px;
            margin-right: 8px;
        }
        .badge-listening {
            background-color: #e0f2fe;
            color: #0369a1;
        }
        .badge-reading {
            background-color: #dcfce7;
            color: #15803d;
        }
        .badge-writing {
            background-color: #fef3c7;
            color: #b45309;
        }
        .grid-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10px;
        }
        .grid-table th {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 5px 6px;
            font-weight: bold;
            text-align: center;
            color: #475569;
        }
        .grid-table td {
            border: 1px solid #cbd5e1;
            padding: 5px 6px;
            vertical-align: top;
        }
        .q-num {
            width: 25px;
            text-align: center;
            font-weight: bold;
            color: #64748b;
            background-color: #f8fafc;
        }
        .q-ans {
            color: #0f172a;
            font-weight: 500;
        }
        .empty-val {
            color: #94a3b8;
            font-style: italic;
        }
        .writing-card {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            margin-bottom: 18px;
            padding: 14px 16px;
            background-color: #ffffff;
        }
        .writing-card-title {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 4px;
        }
        .writing-card-meta {
            font-size: 10.5px;
            color: #64748b;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1px dashed #e2e8f0;
        }
        .essay-body {
            font-size: 11.5px;
            line-height: 1.7;
            color: #1e293b;
            text-align: justify;
            white-space: pre-wrap;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <table style="width: 100%;">
            <tr>
                <td>
                    <div class="candidate-name">{{ $session->lead?->name ?? 'Candidate' }}</div>
                    <div class="meta-info">
                        <strong>Test:</strong> {{ $session->ptExam?->title ?? 'IELTS Placement Test' }} &bull; 
                        <strong>Session:</strong> {{ $session->id }}
                    </div>
                </td>
                <td style="text-align: right; vertical-align: top;">
                    <div class="meta-info">
                        <strong>Submitted:</strong> {{ $session->finished_at ? \Carbon\Carbon::parse($session->finished_at)->format('d M Y, H:i') : now()->format('d M Y, H:i') }}<br>
                        <strong>Branch:</strong> {{ $session->lead?->branch?->name ?? 'Head Office' }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- 1. LISTENING ANSWERS --}}
    @if(count($listeningTasks) > 0)
        @foreach($listeningTasks as $taskItem)
            <div class="section-header">
                {{ $taskItem['task']->title ?? 'Listening Section' }}
            </div>
            <div class="section-meta">
                <span class="summary-badge badge-listening">LISTENING</span>
                <strong>Answered:</strong> {{ $taskItem['filled_count'] }} of {{ $taskItem['total_slots'] }} items
                @if(isset($taskItem['raw_score']) && $taskItem['raw_score'] !== null)
                    &bull; <strong>Score:</strong> {{ $taskItem['raw_score'] }} / {{ $taskItem['total_slots'] }}
                    @if(isset($taskItem['band_score']) && $taskItem['band_score'] !== null)
                        (Band {{ number_format($taskItem['band_score'], 1) }})
                    @endif
                @endif
            </div>

            @php
                $chunks = array_chunk(range(1, $taskItem['total_slots']), 10);
            @endphp

            @foreach($chunks as $chunk)
                <table class="grid-table">
                    <tr>
                        @foreach($chunk as $num)
                            <th class="q-num">#{{ $num }}</th>
                        @endforeach
                    </tr>
                    <tr>
                        @foreach($chunk as $num)
                            <td class="q-ans">
                                @if(isset($taskItem['grid'][$num]) && trim((string)$taskItem['grid'][$num]) !== '')
                                    {{ $taskItem['grid'][$num] }}
                                @else
                                    <span class="empty-val">-</span>
                                @endif
                            </td>
                        @endforeach
                    </tr>
                </table>
            @endforeach
        @endforeach
    @endif

    {{-- 2. READING ANSWERS --}}
    @if(count($readingTasks) > 0)
        @foreach($readingTasks as $taskItem)
            <div class="section-header">
                {{ $taskItem['task']->title ?? 'Reading Section' }}
            </div>
            <div class="section-meta">
                <span class="summary-badge badge-reading">READING</span>
                <strong>Answered:</strong> {{ $taskItem['filled_count'] }} of {{ $taskItem['total_slots'] }} items
                @if(isset($taskItem['raw_score']) && $taskItem['raw_score'] !== null)
                    &bull; <strong>Score:</strong> {{ $taskItem['raw_score'] }} / {{ $taskItem['total_slots'] }}
                    @if(isset($taskItem['band_score']) && $taskItem['band_score'] !== null)
                        (Band {{ number_format($taskItem['band_score'], 1) }})
                    @endif
                @endif
            </div>

            @php
                $chunks = array_chunk(range(1, $taskItem['total_slots']), 10);
            @endphp

            @foreach($chunks as $chunk)
                <table class="grid-table">
                    <tr>
                        @foreach($chunk as $num)
                            <th class="q-num">#{{ $num }}</th>
                        @endforeach
                    </tr>
                    <tr>
                        @foreach($chunk as $num)
                            <td class="q-ans">
                                @if(isset($taskItem['grid'][$num]) && trim((string)$taskItem['grid'][$num]) !== '')
                                    {{ $taskItem['grid'][$num] }}
                                @else
                                    <span class="empty-val">-</span>
                                @endif
                            </td>
                        @endforeach
                    </tr>
                </table>
            @endforeach
        @endforeach
    @endif

    {{-- Page break before writing if there are listening or reading items --}}
    @if((count($listeningTasks) > 0 || count($readingTasks) > 0) && count($writingTasks) > 0)
        <div class="page-break"></div>
    @endif

    {{-- 3. WRITING ANSWERS --}}
    @if(count($writingTasks) > 0)
        <div class="section-header">
            Writing Section Submissions
        </div>
        <div class="section-meta">
            <span class="summary-badge badge-writing">WRITING</span>
            Total Writing Tasks: {{ count($writingTasks) }}
        </div>

        @foreach($writingTasks as $index => $item)
            <div class="writing-card">
                <div class="writing-card-title">
                    {{ $item['task']->title ?? ('Writing Task ' . ($index + 1)) }}
                </div>
                <div class="writing-card-meta">
                    <strong>Word Count:</strong> {{ $item['word_count'] }} words
                    @if(!empty($item['file_url']))
                        &bull; <strong>Attached File:</strong> <a href="{{ $item['file_url'] }}">View Uploaded Document</a>
                    @endif
                </div>

                <div class="essay-body">@if(!empty($item['text'])){!! $item['text'] !!}@else<span class="empty-val">(No text response entered by candidate)</span>@endif</div>
            </div>
        @endforeach
    @endif
</body>
</html>
