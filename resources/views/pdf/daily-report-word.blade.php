<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset="utf-8">
    <title>Daily Operational Report</title>
    <style>
        body { font-family: 'Courier New', Courier, monospace; font-size: 10pt; line-height: 1.2; }
        .header { font-weight: bold; font-size: 12pt; margin-bottom: 10pt; text-decoration: underline; }
        .section { font-weight: bold; margin-top: 15pt; margin-bottom: 5pt; text-transform: uppercase; }
        .item { margin-bottom: 3pt; }
        .divider { margin: 10pt 0; border-top: 1pt dashed #000; }
    </style>
</head>
<body>
    <div class="header">IELC CRM - DAILY OPERATIONAL REPORT</div>
    <div>Date: {{ $dateFormatted }}</div>
    <div>Branch: {{ $branchName }}</div>
    
    <div class="divider"></div>
    <div>REKAP SINGKAT:</div>
    <div>- LEADS BARU  : {{ count($newLeads) }}</div>
    <div>- ENROLLMENT  : {{ count($enrollments) }}</div>
    <div>- AKTIVITAS   : {{ count($activities) }}</div>
    <div>- PLACEMENT   : {{ count($ptSessions) }}</div>
    <div>- FORM REG    : {{ count($registrations) }}</div>
    <div class="divider"></div>

    <div class="section">1. LEADS BARU HARI INI (INCOMING)</div>
    @forelse($newLeads as $ld)
        <div class="item">
            - {{ $ld->name }} ({{ $ld->branch->name ?? '-' }}) 
            >> SOURCE: {{ $ld->leadSource->name ?? 'Manual' }}
        </div>
    @empty
        <div>- Tidak ada lead baru hari ini.</div>
    @endforelse

    <div class="section">2. SISWA BARU (ENROLLMENT HARI INI)</div>
    @forelse($enrollments as $enr)
        <div class="item">
            - {{ $enr->name }} ({{ $enr->branch->name ?? '-' }}) 
            >> STATUS: OFFICIALLY ENROLLED
        </div>
    @empty
        <div>- Tidak ada enrollment lead hari ini.</div>
    @endforelse

    <div class="section">3. AKTIVITAS FRONTDESK</div>
    @forelse($activities as $act)
        <div class="item">
            [{{ \Carbon\Carbon::parse($act->created_at)->format('H:i') }}] 
            {{ $act->lead->name ?? '-' }} ({{ $act->lead->branch->name ?? '-' }}) 
            - {{ strtoupper($act->type) }}: {{ $act->description }} 
            (Staff: {{ $act->user->name ?? '-' }})
        </div>
    @empty
        <div>- Tidak ada aktivitas tercatat.</div>
    @endforelse

    <div class="section">4. HASIL PLACEMENT TEST</div>
    @forelse($ptSessions as $pt)
        <div class="item">
            - {{ $pt->lead->name ?? '-' }}: {{ $pt->ptExam->title ?? '-' }} 
            >> SKOR: {{ $pt->final_score ?? 'N/A' }} ({{ strtoupper($pt->status) }})
        </div>
    @empty
        <div>- Tidak ada tes hari ini.</div>
    @endforelse

    <div class="section">5. PENDAFTARAN FORM (FRONTDESK)</div>
    @forelse($registrations as $reg)
        <div class="item">
            - {{ $reg->name ?? '-' }} ({{ $reg->branch->name ?? '-' }}) 
            >> STATUS: {{ strtoupper($reg->status) }}
        </div>
    @empty
        <div>- Tidak ada pendaftaran form.</div>
    @endforelse

    <div class="divider"></div>
    <div style="font-size: 8pt;">Laporan digenerate otomatis pada {{ now()->format('d/m/Y H:i') }}</div>
</body>
</html>
