<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Daily Operational Report - {{ $dateFormatted }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.4; font-size: 11px; }
        .header { border-bottom: 2px solid #334155; padding-bottom: 15px; margin-bottom: 25px; }
        .logo { font-size: 20px; font-weight: bold; color: #334155; }
        .title { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-top: 5px; }
        .meta { color: #64748b; font-size: 9px; margin-top: 3px; }
        
        .section-title { font-size: 12px; font-weight: bold; color: #1e293b; border-left: 4px solid #334155; padding-left: 8px; margin: 20px 0 10px 0; background: #f8fafc; padding-top: 4px; padding-bottom: 4px; text-transform: uppercase; }
        
        .stats-table { width: 100%; margin-bottom: 20px; border: 1px solid #e2e8f0; }
        .stats-td { padding: 10px; text-align: center; border-right: 1px solid #e2e8f0; }
        .stats-label { font-size: 8px; text-transform: uppercase; color: #64748b; font-weight: bold; }
        .stats-value { font-size: 18px; font-weight: bold; color: #0f172a; }

        table.data-table { width: 100%; border-collapse: collapse; }
        table.data-table th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 9px; text-transform: uppercase; color: #475569; border: 1px solid #e2e8f0; }
        table.data-table td { padding: 8px; border: 1px solid #e2e8f0; font-size: 10px; vertical-align: top; }

        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: bold; text-transform: uppercase; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-amber { background: #fef3c7; color: #92400e; }

        .footer { position: fixed; bottom: 0; width: 100%; font-size: 8px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 8px; }
        
        .page-break { page-break-after: always; }
    </style>
</head>
<body>
    <div class="header">
        <table style="width: 100%; border: none;">
            <tr style="border: none;">
                <td style="border: none; padding: 0;">
                    <div class="logo">IELC CRM</div>
                    <div class="title">Daily Operational Report</div>
                </td>
                <td style="border: none; padding: 0; text-align: right; vertical-align: top;">
                    <div class="meta">Branch: <strong>{{ $branchName }}</strong></div>
                    <div class="meta">Date: <strong>{{ $dateFormatted }}</strong></div>
                    <div class="meta">Report ID: #OPS-{{ date('mdH') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <table class="stats-table">
        <tr>
            <td class="stats-td">
                <div class="stats-label">Incoming Leads</div>
                <div class="stats-value">{{ count($newLeads) }}</div>
            </td>
            <td class="stats-td">
                <div class="stats-label">Enrollments</div>
                <div class="stats-value">{{ count($enrollments) }}</div>
            </td>
            <td class="stats-td">
                <div class="stats-label">Activities</div>
                <div class="stats-value">{{ count($activities) }}</div>
            </td>
            <td class="stats-td">
                <div class="stats-label">Tests Taken</div>
                <div class="stats-value">{{ count($ptSessions) }}</div>
            </td>
            <td class="stats-td" style="border-right: none;">
                <div class="stats-label">Form Regs</div>
                <div class="stats-value">{{ count($registrations) }}</div>
            </td>
        </tr>
    </table>

    <div class="section-title">1. New Leads Incoming</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="50%">Lead Name</th>
                <th width="50%">Acquisition Source</th>
            </tr>
        </thead>
        <tbody>
            @forelse($newLeads as $ld)
            <tr>
                <td><strong>{{ $ld->name }}</strong><br><span style="font-size: 8px; color: #64748b;">{{ $ld->branch->name ?? '-' }}</span></td>
                <td><span class="badge badge-blue">{{ $ld->leadSource->name ?? 'Manual' }}</span></td>
            </tr>
            @empty
            <tr>
                <td colspan="2" style="text-align: center; color: #94a3b8; padding: 20px;">No new leads today.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">2. Official Student Enrollments</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="50%">Student Name</th>
                <th width="50%">Phase Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($enrollments as $enr)
            <tr>
                <td><strong>{{ $enr->name }}</strong><br><span style="font-size: 8px; color: #64748b;">{{ $enr->branch->name ?? '-' }}</span></td>
                <td><span class="badge badge-green">Officially Enrolled</span></td>
            </tr>
            @empty
            <tr>
                <td colspan="2" style="text-align: center; color: #94a3b8; padding: 20px;">No leads enrolled today.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">3. Frontdesk Activities</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="25%">Lead & Branch</th>
                <th width="15%">Staff</th>
                <th width="45%">Action / Description</th>
                <th width="15%">Time</th>
            </tr>
        </thead>
        <tbody>
            @forelse($activities as $act)
            <tr>
                <td>
                    <strong>{{ $act->lead->name ?? 'Unknown' }}</strong><br>
                    <span style="font-size: 8px; color: #64748b;">{{ $act->lead->branch->name ?? '-' }}</span>
                </td>
                <td>{{ $act->user->name ?? '-' }}</td>
                <td>
                    <span class="badge badge-blue">{{ $act->type }}</span><br>
                    <div style="margin-top: 4px; color: #475569;">{{ $act->description }}</div>
                </td>
                <td>{{ \Carbon\Carbon::parse($act->created_at)->format('H:i') }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="4" style="text-align: center; color: #94a3b8; padding: 20px;">No activities recorded for today.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">4. Placement Test Results</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="33%">Student</th>
                <th width="33%">Exam Title</th>
                <th width="34%">Score & Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($ptSessions as $pt)
            <tr>
                <td><strong>{{ $pt->lead->name ?? '-' }}</strong></td>
                <td>{{ $pt->ptExam->title ?? '-' }}</td>
                <td>
                    <span style="font-size: 14px; font-weight: bold; color: #dc2626;">{{ $pt->final_score ?? 'N/A' }}</span><br>
                    <span class="badge {{ $pt->status === 'graded' ? 'badge-green' : 'badge-amber' }}">{{ $pt->status }}</span>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="3" style="text-align: center; color: #94a3b8; padding: 20px;">No tests taken today.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">5. Daily Form Registrations</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="50%">Name</th>
                <th width="50%">Registration Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($registrations as $reg)
            <tr>
                <td><strong>{{ $reg->name ?? '-' }}</strong></td>
                <td>
                    <span class="badge {{ $reg->status === 'approved' ? 'badge-green' : 'badge-amber' }}">{{ $reg->status }}</span>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="2" style="text-align: center; color: #94a3b8; padding: 20px;">No new form registrations today.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        © 2026 IELC Indonesia. This report is generated automatically by the CRM system for daily operational monitoring.
    </div>
</body>
</html>
