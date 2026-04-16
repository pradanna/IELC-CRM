<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>CRM Leads Report - {{ $monthName }} {{ $year }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; font-size: 12px; }
        .header { border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #ef4444; }
        .title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-top: 5px; }
        .meta { color: #666; font-size: 10px; margin-top: 5px; }
        
        .section-title { font-size: 14px; font-weight: bold; color: #111; border-left: 4px solid #ef4444; padding-left: 10px; margin: 25px 0 15px 0; background: #fef2f2; padding-top: 5px; padding-bottom: 5px; }
        
        .stats-grid { width: 100%; margin-bottom: 30px; }
        .stats-box { background: #fff; border: 1px solid #eee; padding: 15px; text-align: center; }
        .stats-label { font-size: 10px; text-transform: uppercase; color: #999; font-weight: bold; }
        .stats-value { font-size: 20px; font-weight: bold; color: #111; margin-top: 5px; }
        
        .insights-list { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
        .insight-item { margin-bottom: 10px; padding-left: 15px; position: relative; }
        .insight-item:before { content: "•"; color: #ef4444; position: absolute; left: 0; font-weight: bold; }

        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
        td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }

        .footer { position: fixed; bottom: 0; width: 100%; font-size: 8px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <table style="border: none;">
            <tr style="border: none;">
                <td style="border: none; padding: 0;">
                    <div class="logo">IELC CRM</div>
                    <div class="title">Leads Analytics Report</div>
                </td>
                <td style="border: none; padding: 0; text-align: right; vertical-align: top;">
                    <div class="meta">Branch: {{ $branchName }}</div>
                    <div class="meta">Period: {{ $monthName }} {{ $year }}</div>
                    <div class="meta">Generated: {{ now()->format('d M Y, H:i') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="section-title">Executive Summary</div>
    <table class="stats-grid">
        <tr>
            <td class="stats-box">
                <div class="stats-label">Total Leads Baru</div>
                <div class="stats-value">{{ $newLeadsCount }}</div>
            </td>
            <td class="stats-box">
                <div class="stats-label">Enrolled Student</div>
                <div class="stats-value">{{ $enrolledCount }}</div>
            </td>
            <td class="stats-box">
                <div class="stats-label">Conversion Rate</div>
                <div class="stats-value">
                    {{ $newLeadsCount > 0 ? round(($enrolledCount / $newLeadsCount) * 100, 1) : 0 }}%
                </div>
            </td>
        </tr>
    </table>

    <div class="section-title">Conversion Performance</div>
    <table class="stats-grid">
        <tr>
            <td class="stats-box">
                <div class="stats-label">New -> Prospective</div>
                <div class="stats-value">
                    {{ $successRates['newToProspective']['count'] }} / {{ $successRates['newToProspective']['total'] }}
                </div>
                <div class="stats-label" style="margin-top: 5px; color: #ef4444;">{{ $successRates['newToProspective']['percentage'] }}%</div>
            </td>
            <td class="stats-box">
                <div class="stats-label">New -> Lost</div>
                <div class="stats-value">
                    {{ $successRates['newToLost']['count'] }} / {{ $successRates['newToLost']['total'] }}
                </div>
                <div class="stats-label" style="margin-top: 5px; color: #ef4444;">{{ $successRates['newToLost']['percentage'] }}%</div>
            </td>
            <td class="stats-box">
                <div class="stats-label">Prosp -> Enrollment</div>
                <div class="stats-value">
                    {{ $successRates['prospectiveToClosing']['count'] }} / {{ $successRates['prospectiveToClosing']['total'] }}
                </div>
                <div class="stats-label" style="margin-top: 5px; color: #ef4444;">{{ $successRates['prospectiveToClosing']['percentage'] }}%</div>
            </td>
            <td class="stats-box">
                <div class="stats-label">Prosp -> Lost</div>
                <div class="stats-value">
                    {{ $successRates['prospectiveToLost']['count'] }} / {{ $successRates['prospectiveToLost']['total'] }}
                </div>
                <div class="stats-label" style="margin-top: 5px; color: #ef4444;">{{ $successRates['prospectiveToLost']['percentage'] }}%</div>
            </td>
        </tr>
    </table>

    <div class="section-title">Automated Insights</div>
    <div class="insights-list">
        @foreach($insights as $insight)
            <div class="insight-item">{!! $insight !!}</div>
        @endforeach
    </div>

    <div class="section-title">Source Distribution</div>
    <table>
        <thead>
            <tr>
                <th>Lead Source</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr>
        </thead>
        <tbody>
            @foreach(\App\Models\LeadSource::all() as $source)
                @php $count = $sourceStats[$source->id] ?? 0; @endphp
                @if($count > 0)
                <tr>
                    <td style="font-weight: bold;">{{ $source->name }}</td>
                    <td>{{ $count }}</td>
                    <td>{{ $newLeadsCount > 0 ? round(($count / $newLeadsCount) * 100) : 0 }}%</td>
                </tr>
                @endif
            @endforeach
        </tbody>
    </table>

    <div class="section-title">Lead Records (Excerpt)</div>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Branch</th>
                <th>Source</th>
                <th>Current Phase</th>
                <th>Created At</th>
            </tr>
        </thead>
        <tbody>
            @foreach($leads->take(20) as $lead)
            <tr>
                <td style="font-weight: bold;">{{ $lead->name }}</td>
                <td>{{ $lead->branch->name ?? '-' }}</td>
                <td>{{ $lead->leadSource->name ?? '-' }}</td>
                <td>{{ $lead->leadPhase->name ?? '-' }}</td>
                <td>{{ $lead->created_at->format('d/m/Y') }}</td>
            </tr>
            @endforeach
            @if($leads->count() > 20)
            <tr>
                <td colspan="5" style="text-align: center; color: #999; font-style: italic;">... and {{ $leads->count() - 20 }} more leads</td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="footer">
        © {{ date('Y') }} IELC Indonesia CRM System. This document is confidential and intended for internal reporting purposes.
    </div>
</body>
</html>
