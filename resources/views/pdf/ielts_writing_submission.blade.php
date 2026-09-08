<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Writing - {{ $session->lead?->name ?? 'Candidate' }}</title>
    <style>
        @page {
            margin: 20mm 20mm 20mm 20mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0f172a;
            font-size: 13px;
            line-height: 1.7;
        }
        .header {
            margin-bottom: 25px;
            padding-bottom: 12px;
            border-bottom: 2px solid #0f172a;
        }
        .candidate-name {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 4px;
        }
        .meta-info {
            font-size: 11px;
            color: #64748b;
        }
        .task-container {
            margin-bottom: 30px;
        }
        .task-title {
            font-size: 14px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e2e8f0;
        }
        .task-meta {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 12px;
        }
        .essay-content {
            font-size: 13px;
            line-height: 1.8;
            color: #1e293b;
            white-space: pre-wrap;
            text-align: justify;
        }
        .empty-text {
            color: #94a3b8;
            font-style: italic;
        }
        .task-separator {
            margin: 25px 0;
            border: 0;
            border-top: 1px dashed #cbd5e1;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="candidate-name">{{ $session->lead?->name ?? 'Candidate' }}</div>
        <div class="meta-info">
            IELTS Placement Test &bull; Submitted: {{ $session->finished_at ? \Carbon\Carbon::parse($session->finished_at)->format('d M Y, H:i') : now()->format('d M Y, H:i') }}
        </div>
    </div>

    @forelse($writingTasks as $index => $item)
        <div class="task-container">
            <div class="task-title">
                {{ $item['task']->title ?? ('Task ' . ($index + 1)) }}
            </div>
            <div class="task-meta">
                Word Count: <strong>{{ $item['word_count'] }}</strong> words
            </div>

            <div class="essay-content">@if(!empty($item['text'])){!! $item['text'] !!}@else<span class="empty-text">(No response entered by candidate)</span>@endif</div>
        </div>

        @if(!$loop->last)
            <hr class="task-separator" />
        @endif
    @empty
        <div class="empty-text">No writing submission found.</div>
    @endforelse
</body>
</html>
