<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Domains\CRM\Application\Actions\Reports\FetchCrmDailyReport;
use App\Domains\CRM\Application\Actions\Reports\FetchCrmReportData;
use App\Http\Controllers\Controller;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\LeadSource;
use App\Domains\Master\Domain\Models\LeadPhase;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Resources\Master\BranchResource;
use App\Http\Resources\Crm\LeadSourceResource;
use App\Http\Resources\Crm\LeadPhaseResource;
use Carbon\Carbon;

class CrmReportController extends Controller
{
    public function index(Request $request, FetchCrmReportData $action): Response
    {
        $now = Carbon::now();
        $user = auth()->user();
        $month = (int) $request->input('month', $now->month);
        $year = (int) $request->input('year', $now->year);
        $branchId = $request->input('branch_id');

        $data = $action->handle($month, $year, $branchId, $user);

        return Inertia::render('Admin/Crm/Reports/Index', [
            'leads' => $data['leads'],
            'branches' => BranchResource::collection(Branch::select('id', 'name')->get()),
            'sources' => LeadSourceResource::collection(LeadSource::select('id', 'name')->get()),
            'phases' => LeadPhaseResource::collection(LeadPhase::select('id', 'name', 'code')->get()),
            'filters' => [
                'month' => (int)$month,
                'year' => (int)$year,
                'branch_id' => $branchId,
            ],
            'monthlyGoal' => $data['monthlyGoal'],
            'newLeadsCount' => $data['newLeadsCount'],
            'enrolledLeadsCount' => $data['enrolledLeadsCount'],
            'successRates' => $data['success_rates'],
            'insights' => $action->generateInsights($data['leads'], $data['monthlyGoal'], $data['enrolledLeadsCount'], $data['newLeadsCount'], $month),
        ]);
    }

    public function download(Request $request, FetchCrmReportData $action)
    {
        $month = (int) $request->input('month', Carbon::now()->month);
        $year = (int) $request->input('year', Carbon::now()->year);
        $branchId = $request->input('branch_id');
        $user = auth()->user();

        $data = $action->handle($month, $year, $branchId, $user);
        $leads = $data['leads'];
        $enrolledCount = $data['enrolledLeadsCount'];
        $newLeadsCount = $data['newLeadsCount'];
        $monthlyGoal = $data['monthlyGoal'];
        $insights = $action->generateInsights($leads, $monthlyGoal, $enrolledCount, $newLeadsCount, $month);

        $newLeads = $leads->filter(fn($l) => $l->created_at->month == $month && $l->created_at->year == $year);
        $sourceStats = $newLeads->groupBy('lead_source_id')->map(fn($group) => count($group));
        $phaseStats = $newLeads->groupBy('lead_phase_id')->map(fn($group) => count($group));

        $monthName = Carbon::create()->month($month)->format('F');
        $successRates = $data['success_rates'];

        $branchName = 'All Branches';
        if ($branchId && !in_array($branchId, ['all', 'null', 'undefined', ''])) {
            $branchName = Branch::find($branchId)?->name ?? 'All Branches';
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.crm-report', compact(
            'leads', 'insights', 'branchName', 'monthName', 'year', 'sourceStats', 'phaseStats', 'enrolledCount', 'newLeadsCount', 'successRates'
        ));

        return $pdf->stream("CRM-Report-{$monthName}-{$year}.pdf");
    }

    public function daily(Request $request, FetchCrmDailyReport $action): Response
    {
        $date = $request->input('date', Carbon::today()->toDateString());
        $branchId = $request->input('branch_id');
        $user = auth()->user();

        $data = $action->handle($date, $branchId, $user);

        return Inertia::render('Admin/Crm/Reports/Daily', array_merge($data, [
            'branches' => BranchResource::collection(Branch::select('id', 'name')->get()),
            'filters' => [
                'date' => $date,
                'branch_id' => $branchId,
            ]
        ]));
    }

    public function downloadDaily(Request $request, FetchCrmDailyReport $action)
    {
        $date = $request->input('date', Carbon::today()->toDateString());
        $branchId = $request->input('branch_id');
        $user = auth()->user();

        if ($branchId === 'null' || $branchId === '' || $branchId === 'undefined') {
            $branchId = 'all';
        }

        $data = $action->handle($date, $branchId, $user);
        $dateFormatted = Carbon::parse($date)->format('d F Y');
        $branchName = $branchId && $branchId !== 'all' ? Branch::find($branchId)?->name : 'All Branches';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.daily-report', array_merge($data, [
            'dateFormatted' => $dateFormatted,
            'branchName' => $branchName
        ]));

        return $pdf->stream("Daily-Report-{$date}.pdf");
    }

    public function downloadDailyWord(Request $request, FetchCrmDailyReport $action)
    {
        $date = $request->input('date', Carbon::today()->toDateString());
        $branchId = $request->input('branch_id');
        $user = auth()->user();

        if ($branchId === 'null' || $branchId === '' || $branchId === 'undefined') {
            $branchId = 'all';
        }

        $data = $action->handle($date, $branchId, $user);
        $dateFormatted = Carbon::parse($date)->format('d F Y');
        $branchName = $branchId && $branchId !== 'all' ? Branch::find($branchId)?->name : 'All Branches';

        $filename = "Daily-Report-{$date}.doc";

        $content = view('pdf.daily-report-word', array_merge($data, [
            'dateFormatted' => $dateFormatted,
            'branchName' => $branchName
        ]))->render();

        return response($content)
            ->header('Content-Type', 'application/msword')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }
}



