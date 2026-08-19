<?php

namespace App\Domains\Shared\Actions\Dashboard;

use App\Domains\Master\Domain\Models\Branch;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\Master\Domain\Models\LeadSource;
use App\Domains\CRM\Domain\Models\MonthlyTarget;
use App\Domains\CRM\Domain\Models\Task;
use App\Domains\Academic\Domain\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FetchSuperadminDashboardData
{
    public function handle(): array
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();

        // 1. Summary Stats
        $hotLeadPhases = LeadPhase::whereIn('code', ['consultation', 'placement-test'])->pluck('id');
        
        $summary = [
            'total_students' => Student::where('status', 'active')->count(),
            'hot_leads' => Lead::whereIn('lead_phase_id', $hotLeadPhases)->count(),
            'follow_up_today' => Task::where('is_completed', false)
                ->where('due_date', '<=', $now->toDateTimeString())
                ->count(),
            'new_leads_this_month' => Lead::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count(),
        ];

        // 2. Branch Performance
        $branches = Branch::all();
        $branchPerformance = $branches->map(function ($branch) use ($now, $startOfMonth, $endOfMonth) {
            $target = MonthlyTarget::where('branch_id', $branch->id)
                ->where('year', $now->year)
                ->where('month', $now->month)
                ->first();

            $actual = LeadEnrollment::whereBetween('joined_at', [$startOfMonth, $endOfMonth])
                ->whereHas('lead', fn($q) => $q->where('branch_id', $branch->id))
                ->count();

            $targetValue = $target?->target_enrolled ?? 0;
            $achievement = $targetValue > 0 ? round(($actual / $targetValue) * 100) : 0;

            return [
                'name' => $branch->name,
                'actual' => $actual,
                'target' => $targetValue,
                'achievement' => $achievement,
            ];
        });

        // 3. Lead Source Distribution
        $leadSources = LeadSource::withCount(['leads' => function ($query) use ($startOfMonth, $endOfMonth) {
            $query->whereBetween('created_at', [$startOfMonth, $endOfMonth]);
        }])->get();

        $sourceDistribution = $leadSources->map(fn($source) => [
            'name' => $source->name,
            'count' => $source->leads_count,
            'color' => $this->getRandomChartColor($source->code),
        ])->filter(fn($s) => $s['count'] > 0)->values();

        // 4. Leads by City
        $cityDistribution = Lead::select('city', DB::raw('count(*) as count'))
            ->whereNotNull('city')
            ->where('city', '!=', '')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->groupBy('city')
            ->orderByDesc('count')
            ->get();

        return [
            'summary' => $summary,
            'branch_performance' => $branchPerformance,
            'lead_sources' => $sourceDistribution,
            'leads_by_city' => $cityDistribution,
        ];
    }

    private function getRandomChartColor(string $seed): string
    {
        $colors = [
            '#3b82f6', // blue-500
            '#ef4444', // red-500
            '#10b981', // emerald-500
            '#f59e0b', // amber-500
            '#8b5cf6', // violet-500
            '#ec4899', // pink-500
            '#06b6d4', // cyan-500
            '#f97316', // orange-500
        ];
        
        // Simple consistent color based on string
        $index = hexdec(substr(md5($seed), 0, 8)) % count($colors);
        return $colors[$index];
    }
}


