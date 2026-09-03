<?php

namespace App\Domains\CRM\Application\Actions\Reports;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\CRM\Domain\Models\MonthlyTarget;
use App\Domains\Master\Domain\Models\LeadSource;
use Carbon\Carbon;

class FetchCrmReportData
{
    public function handle(int $month, int $year, ?string $branchId, $user): array
    {
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $validBranchId = ($branchId && $branchId !== 'all' && $branchId !== 'null' && $branchId !== 'undefined') ? $branchId : null;
        $isSuperadmin = $user->superadmin()->exists() || $user->hasRole(['superadmin', 'super-admin', 'frontdesk', 'marketing']);

        $applyFilters = function ($query) use ($validBranchId, $isSuperadmin, $user) {
            if (!$isSuperadmin) {
                $query->where('branch_id', $user->branch_id);
            } elseif ($validBranchId) {
                $query->where('branch_id', $validBranchId);
            }
            return $query;
        };

        $cohortQuery = Lead::query()->whereBetween('created_at', [$startDate, $endDate]);
        $cohortQuery = $applyFilters($cohortQuery);
        $newLeadsCount = $cohortQuery->count();

        $monthlyGoal = (int) MonthlyTarget::where('month', $month)
            ->where('year', $year)
            ->when($validBranchId, fn($q) => $q->where('branch_id', $validBranchId))
            ->sum('target_enrolled') ?: 0;

        if ($newLeadsCount === 0) {
            return [
                'leads' => collect(),
                'newLeadsCount' => 0,
                'enrolledLeadsCount' => 0,
                'monthlyGoal' => $monthlyGoal,
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

        $cohortLeads = $cohortQuery->get();

        $reachedProspectiveCount = $cohortLeads->filter(fn($l) => !is_null($l->reached_prospective_at))->count();
        $consultationCount = $cohortLeads->filter(fn($l) => !is_null($l->first_consultation_at))->count();
        $ptCount = $cohortLeads->filter(fn($l) => !is_null($l->first_pt_at))->count();

        $enrolledQuery = LeadEnrollment::whereIn('lead_id', $cohortLeads->pluck('id'))
            ->whereBetween('joined_at', [$startDate, $endDate]);
        $enrolledCount = $enrolledQuery->count();

        $unifiedLeads = Lead::with(['leadSource', 'leadPhase', 'branch'])
            ->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate])
                  ->orWhereBetween('reached_prospective_at', [$startDate, $endDate])
                  ->orWhereBetween('enrolled_at', [$startDate, $endDate])
                  ->orWhereBetween('lost_at', [$startDate, $endDate]);
            });
        $unifiedLeads = $applyFilters($unifiedLeads)->latest()->get();

        return [
            'leads' => $unifiedLeads,
            'newLeadsCount' => $newLeadsCount,
            'enrolledLeadsCount' => $enrolledCount,
            'monthlyGoal' => $monthlyGoal,
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

    public function generateInsights($leads, int $monthlyGoal, int $enrolledCount, int $newLeadsCount, int $month): array
    {
        if ($leads->isEmpty() && $enrolledCount === 0) {
            return ["No data available for the selected period to generate insights."];
        }

        $insights = [];

        if ($newLeadsCount > 0) {
            $newLeads = $leads->filter(fn($l) => $l->created_at->month == $month);
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

        if ($newLeadsCount > 0) {
            $convRate = round(($enrolledCount / $newLeadsCount) * 100, 1);
            $insights[] = "<strong>Conversion Rate:</strong> Tingkat konversi bulan ini berada di angka {$convRate}% (Berdasarkan {$enrolledCount} join dari {$newLeadsCount} lead baru).";
        }

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
