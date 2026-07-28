<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Http\Controllers\Controller;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\LeadSource;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\CRM\Domain\Models\MonthlyTarget;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Resources\Master\BranchResource;
use App\Http\Resources\Crm\LeadSourceResource;
use App\Http\Resources\Crm\LeadPhaseResource;
use Carbon\Carbon;

class CrmReportController extends Controller
{
    public function index(Request $request): Response
    {
        $now = Carbon::now();
        $user = auth()->user();
        $month = (int) $request->input('month', $now->month);
        $year = (int) $request->input('year', $now->year);
        $branchId = $request->input('branch_id');

        $isSuperadmin = $user->superadmin()->exists() || $user->hasRole(['superadmin', 'super-admin', 'frontdesk', 'marketing']);

        $data = $this->getReportData($month, $year, $branchId);

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
            'insights' => $this->generateInsights($data['leads'], $data['monthlyGoal'], $data['enrolledLeadsCount'], $data['newLeadsCount']),
        ]);
    }

    public function download(Request $request)
    {
        $month = (int) $request->input('month', Carbon::now()->month);
        $year = (int) $request->input('year', Carbon::now()->year);
        $branchId = $request->input('branch_id');

        $data = $this->getReportData($month, $year, $branchId);
        $leads = $data['leads'];
        $enrolledCount = $data['enrolledLeadsCount'];
        $newLeadsCount = $data['newLeadsCount'];
        $monthlyGoal = $data['monthlyGoal'];
        $insights = $this->generateInsights($leads, $monthlyGoal, $enrolledCount, $newLeadsCount);

        // Grouping for PDF visibility (Based on NEW leads for marketing accuracy)
        $newLeads = $leads->filter(fn($l) => $l->created_at->month == $month && $l->created_at->year == $year);
        $sourceStats = $newLeads->groupBy('lead_source_id')->map(fn($group) => count($group));
        $phaseStats = $newLeads->groupBy('lead_phase_id')->map(fn($group) => count($group));
        
        $monthName = Carbon::create()->month($month)->format('F');
        $successRates = $data['success_rates'];
        
        // Handle "All Branches" label robustly
        $branchName = 'All Branches';
        if ($branchId && !in_array($branchId, ['all', 'null', 'undefined', ''])) {
            $branchName = \App\Domains\Master\Domain\Models\Branch::find($branchId)?->name ?? 'All Branches';
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.crm-report', compact(
            'leads', 'insights', 'branchName', 'monthName', 'year', 'sourceStats', 'phaseStats', 'enrolledCount', 'newLeadsCount', 'successRates'
        ));

        return $pdf->stream("CRM-Report-{$monthName}-{$year}.pdf");
    }

    public function daily(Request $request): Response
    {
        $date = $request->input('date', Carbon::today()->toDateString());
        $branchId = $request->input('branch_id');

        $data = $this->getDailyData($date, $branchId);

        return Inertia::render('Admin/Crm/Reports/Daily', array_merge($data, [
            'branches' => BranchResource::collection(Branch::select('id', 'name')->get()),
            'filters' => [
                'date' => $date,
                'branch_id' => $branchId,
            ]
        ]));
    }

    public function downloadDaily(Request $request)
    {
        $date = $request->input('date', Carbon::today()->toDateString());
        $branchId = $request->input('branch_id');

        // Handle string "null" from JS URL params
        if ($branchId === 'null' || $branchId === '' || $branchId === 'undefined') {
            $branchId = 'all';
        }

        $data = $this->getDailyData($date, $branchId);
        $dateFormatted = Carbon::parse($date)->format('d F Y');
        $branchName = $branchId && $branchId !== 'all' ? Branch::find($branchId)?->name : 'All Branches';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.daily-report', array_merge($data, [
            'dateFormatted' => $dateFormatted,
            'branchName' => $branchName
        ]));

        return $pdf->stream("Daily-Report-{$date}.pdf");
    }

    public function downloadDailyWord(Request $request)
    {
        $date = $request->input('date', Carbon::today()->toDateString());
        $branchId = $request->input('branch_id');

        if ($branchId === 'null' || $branchId === '' || $branchId === 'undefined') {
            $branchId = 'all';
        }

        $data = $this->getDailyData($date, $branchId);
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

    private function getDailyData($date, $branchId)
    {
        $start = Carbon::parse($date)->startOfDay();
        $end = Carbon::parse($date)->endOfDay();
        $user = auth()->user();
        $isSuperadmin = $user->superadmin()->exists() || $user->hasRole(['superadmin', 'super-admin', 'frontdesk', 'marketing']);

        // Security/Scope logic for Superadmin vs Staff
        $targetBranchId = $branchId;
        $targetOwnerId = null;

        if (!$isSuperadmin) {
            $targetOwnerId = $user->id;
            $targetBranchId = $user->branch_id;
        } elseif ($branchId === 'all' || !$branchId) {
            $targetBranchId = null;
        }

        // 1. New Leads (Created today)
        $newLeadsQuery = \App\Domains\CRM\Domain\Models\Lead::with(['branch', 'leadSource'])
            ->whereBetween('created_at', [$start, $end]);
        if ($targetBranchId) $newLeadsQuery->where('branch_id', $targetBranchId);
        if ($targetOwnerId) $newLeadsQuery->where('owner_id', $targetOwnerId);
        $newLeads = $newLeadsQuery->latest()->get();

        // 2. New Enrollments (Enrolled today) — from lead_enrollments
        $enrollmentsQuery = LeadEnrollment::with(['lead.branch', 'lead.leadSource', 'studyClass'])
            ->whereBetween('joined_at', [$start, $end]);
        if ($targetBranchId) {
            $enrollmentsQuery->whereHas('lead', fn($q) => $q->where('branch_id', $targetBranchId));
        }
        if ($targetOwnerId) {
            $enrollmentsQuery->whereHas('lead', fn($q) => $q->where('owner_id', $targetOwnerId));
        }
        $enrollments = $enrollmentsQuery->latest()->get();

        // 3. Activities
        $activityQuery = \App\Domains\CRM\Domain\Models\LeadActivity::with(['lead.branch', 'user'])
            ->whereBetween('created_at', [$start, $end]);
        if ($targetOwnerId) {
            $activityQuery->where('user_id', $targetOwnerId);
        } elseif ($targetBranchId) {
            $activityQuery->whereHas('lead', fn($q) => $q->where('branch_id', $targetBranchId));
        }
        $activities = $activityQuery->latest()->get();

        // 4. Placement Tests
        $ptQuery = \App\Domains\Academic\Domain\Models\PtSession::with(['lead.branch', 'ptExam'])
            ->whereBetween('created_at', [$start, $end]);
        if ($targetOwnerId) {
            $ptQuery->whereHas('lead', fn($q) => $q->where('owner_id', $targetOwnerId));
        } elseif ($targetBranchId) {
            $ptQuery->whereHas('lead', fn($q) => $q->where('branch_id', $targetBranchId));
        }
        $ptSessions = $ptQuery->latest()->get();

        // 5. New Registrations
        $regQuery = \App\Domains\CRM\Domain\Models\LeadRegistration::with(['branch'])
            ->whereBetween('created_at', [$start, $end]);
        if ($targetBranchId) {
            $regQuery->where('branch_id', $targetBranchId);
        }
        $registrations = $regQuery->latest()->get();

        return [
            'newLeads' => $newLeads,
            'enrollments' => $enrollments,
            'activities' => $activities,
            'ptSessions' => $ptSessions,
            'registrations' => $registrations,
        ];
    }

    private function getReportData($month, $year, $branchId)
    {
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();
        $user = auth()->user();
        
        $validBranchId = ($branchId && $branchId !== 'all' && $branchId !== 'null' && $branchId !== 'undefined') ? $branchId : null;
        $isSuperadmin = $user->superadmin()->exists() || $user->hasRole(['superadmin', 'super-admin', 'frontdesk', 'marketing']);

        // Filter helper for Monthly (Scope by Branch for staff, Global for Superadmin)
        $applyFilters = function ($query) use ($validBranchId, $isSuperadmin, $user) {
            if (!$isSuperadmin) {
                // Staff always sees their own branch data for Monthly Analytics
                $query->where('branch_id', $user->branch_id);
            } elseif ($validBranchId) {
                // Superadmin can filter by specific branch
                $query->where('branch_id', $validBranchId);
            }
            return $query;
        };

        // 1. Denominator: Leads strictly CREATED in this period (The Cohort)
        $cohortQuery = Lead::query()->whereBetween('created_at', [$startDate, $endDate]);
        $cohortQuery = $applyFilters($cohortQuery);
        $newLeadsCount = $cohortQuery->count();

        // If no leads were created in this period, we return zeroed stats
        if ($newLeadsCount === 0) {
            return [
                'leads' => collect(),
                'newLeadsCount' => 0,
                'enrolledLeadsCount' => 0,
                'monthlyGoal' => (int) MonthlyTarget::where('month', $month)->where('year', $year)->when($validBranchId, fn($q) => $q->where('branch_id', $validBranchId))->sum('target_enrolled') ?: 0,
                'success_rates' => [
                    'new_to_prospective' => ['count' => 0, 'total' => 0, 'percentage' => 0],
                    'prospective_to_consultation' => ['count' => 0, 'total' => 0, 'percentage' => 0],
                    'consultation_to_pt' => ['count' => 0, 'total' => 0, 'percentage' => 0],
                    'pt_to_closing' => ['count' => 0, 'total' => 0, 'percentage' => 0],
                    'new_to_closing' => ['count' => 0, 'total' => 0, 'percentage' => 0],
                    'prospective_to_closing' => ['count' => 0, 'total' => 0, 'percentage' => 0],
                    'consultation_to_closing' => ['count' => 0, 'total' => 0, 'percentage' => 0],
                ],
            ];
        }

        // Fetch the cohort leads
        $cohortLeads = $cohortQuery->get();

        // 2. Calculate milestones for THIS COHORT
        $reachedProspectiveCount = $cohortLeads->filter(fn($l) => !is_null($l->reached_prospective_at))->count();
        $consultationCount = $cohortLeads->filter(fn($l) => !is_null($l->first_consultation_at))->count();
        $ptCount = $cohortLeads->filter(fn($l) => !is_null($l->first_pt_at))->count();
        // Enrolled count from lead_enrollments (per-enrollment, not per-lead)
        $enrolledQuery = LeadEnrollment::whereIn('lead_id', $cohortLeads->pluck('id'))
            ->whereBetween('joined_at', [$startDate, $endDate]);
        $enrolledCount = $enrolledQuery->count();
        $lostCount = $cohortLeads->filter(fn($l) => !is_null($l->lost_at))->count();

        // 3. Final Unified Collection for the Table (Events that happened this month)
        // Note: For the TABLE display, we keep the original "Flow" logic so staff can see what they did this month
        $unifiedLeads = Lead::with(['leadSource', 'leadPhase', 'branch'])
            ->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate])
                  ->orWhereBetween('reached_prospective_at', [$startDate, $endDate])
                  ->orWhereBetween('enrolled_at', [$startDate, $endDate])
                  ->orWhereBetween('lost_at', [$startDate, $endDate]);
            });
        $unifiedLeads = $applyFilters($unifiedLeads)->latest()->get();

        $targetQuery = MonthlyTarget::where('month', $month)->where('year', $year);
        if ($validBranchId) $targetQuery->where('branch_id', $validBranchId);

        return [
            'leads' => $unifiedLeads,
            'newLeadsCount' => $newLeadsCount,
            'enrolledLeadsCount' => $enrolledCount,
            'monthlyGoal' => (int) $targetQuery->sum('target_enrolled') ?: 0,
            'success_rates' => [
                'new_to_prospective' => [
                    'count' => $reachedProspectiveCount,
                    'total' => $newLeadsCount,
                    'percentage' => round(($reachedProspectiveCount / $newLeadsCount) * 100, 1)
                ],
                'prospective_to_consultation' => [
                    'count' => $consultationCount,
                    'total' => $reachedProspectiveCount,
                    'percentage' => $reachedProspectiveCount > 0 ? round(($consultationCount / $reachedProspectiveCount) * 100, 1) : 0
                ],
                'consultation_to_pt' => [
                    'count' => $ptCount,
                    'total' => $consultationCount,
                    'percentage' => $consultationCount > 0 ? round(($ptCount / $consultationCount) * 100, 1) : 0
                ],
                'pt_to_closing' => [
                    'count' => $enrolledCount,
                    'total' => $ptCount,
                    'percentage' => $ptCount > 0 ? round(($enrolledCount / $ptCount) * 100, 1) : 0
                ],
                'new_to_closing' => [
                    'count' => $enrolledCount,
                    'total' => $newLeadsCount,
                    'percentage' => round(($enrolledCount / $newLeadsCount) * 100, 1)
                ],
                'prospective_to_closing' => [
                    'count' => $enrolledCount,
                    'total' => $reachedProspectiveCount,
                    'percentage' => $reachedProspectiveCount > 0 ? round(($enrolledCount / $reachedProspectiveCount) * 100, 1) : 0
                ],
                'consultation_to_closing' => [
                    'count' => $enrolledCount,
                    'total' => $consultationCount,
                    'percentage' => $consultationCount > 0 ? round(($enrolledCount / $consultationCount) * 100, 1) : 0
                ],
            ],
        ];
    }

    private function calculateSuccessRates($leads): array
    {
        $totalLeads = $leads->count();

        if ($totalLeads === 0) {
            return [
                'new_to_prospective' => 0,
                'new_to_closing' => 0,
                'new_to_lost' => 0,
                'prospective_to_closing' => 0,
                'prospective_to_lost' => 0,
            ];
        }

        $reachedProspectiveCount = $leads->filter(fn($l) => !is_null($l->reached_prospective_at))->count();
        $closingCount = $leads->filter(fn($l) => !is_null($l->enrolled_at))->count();
        $lostCount = $leads->filter(fn($l) => !is_null($l->lost_at))->count();
        $lostAfterProspectiveCount = $leads->filter(fn($l) => !is_null($l->lost_at) && !is_null($l->reached_prospective_at))->count();

        return [
            'newToProspective' => [
                'count' => $reachedProspectiveCount,
                'total' => $totalLeads,
                'percentage' => round(($reachedProspectiveCount / $totalLeads) * 100, 1)
            ],
            'newToClosing' => [
                'count' => $closingCount,
                'total' => $totalLeads,
                'percentage' => round(($closingCount / $totalLeads) * 100, 1)
            ],
            'newToLost' => [
                'count' => $lostCount,
                'total' => $totalLeads,
                'percentage' => round(($lostCount / $totalLeads) * 100, 1)
            ],
            'prospectiveToClosing' => [
                'count' => $closingCount,
                'total' => $reachedProspectiveCount,
                'percentage' => $reachedProspectiveCount > 0 ? round(($closingCount / $reachedProspectiveCount) * 100, 1) : 0
            ],
            'prospectiveToLost' => [
                'count' => $lostAfterProspectiveCount,
                'total' => $reachedProspectiveCount,
                'percentage' => $reachedProspectiveCount > 0 ? round(($lostAfterProspectiveCount / $reachedProspectiveCount) * 100, 1) : 0
            ],
        ];
    }

    private function generateInsights($leads, $monthlyGoal, $enrolledCount, $newLeadsCount)
    {
        if ($leads->isEmpty() && $enrolledCount === 0) {
            return ["No data available for the selected period to generate insights."];
        }

        $insights = [];
        
        // Source Insight (Based on New Leads only for marketing accuracy)
        if ($newLeadsCount > 0) {
            // We need to re-filter leads to get only the NEW ones for accurate source reporting
            $newLeads = $leads->filter(fn($l) => $l->created_at->month == request('month', Carbon::now()->month));
            
            $topSourceId = $newLeads->groupBy('lead_source_id')
                ->map->count()
                ->sortDesc()
                ->keys()
                ->first();
            $topSource = LeadSource::find($topSourceId)?->name ?? 'Unknown';
            $sourceCount = $newLeads->where('lead_source_id', $topSourceId)->count();
            $sourcePct = round(($sourceCount / $newLeadsCount) * 100);
            $insights[] = "<strong>Top Acquisition Source:</strong> {$topSource} menyumbang {$sourcePct}% dari total leads baru ({$sourceCount} leads).";
        }

        // Conversion Insight (Aligned with enrolled_at)
        if ($newLeadsCount > 0) {
            $convRate = round(($enrolledCount / $newLeadsCount) * 100, 1);
            $insights[] = "<strong>Conversion Rate:</strong> Tingkat konversi bulan ini berada di angka {$convRate}% (Berdasarkan {$enrolledCount} join dari {$newLeadsCount} lead baru).";
        }

        // Target Insight
        if ($monthlyGoal > 0) {
            $pctOfTarget = round(($enrolledCount / $monthlyGoal) * 100);
            if ($pctOfTarget >= 100) {
                $insights[] = "<strong>Target Achievement:</strong> Sangat Bagus! Cabang telah melampaui target bulanan ({$pctOfTarget}% tercapai).";
            } else {
                $insights[] = "<strong>Target Achievement:</strong> Baru mencapai {$pctOfTarget}% dari target {$monthlyGoal} siswa join bulan ini.";
            }
        }

        return $insights;
    }
}


