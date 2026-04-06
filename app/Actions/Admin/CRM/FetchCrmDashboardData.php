<?php

namespace App\Actions\Admin\CRM;

use App\Models\Lead;
use App\Models\LeadPhase;
use App\Models\Task;
use App\Models\MonthlyTarget;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FetchCrmDashboardData
{
    public function handle(array $filters = []): array
    {
        $now = \Carbon\Carbon::now();
        $month = $filters['month'] ?? $now->month;
        $year = $filters['year'] ?? $now->year;
        $branchId = $filters['branch_id'] ?? null;

        $cacheKey = "crm_dashboard_data_{$year}_{$month}_" . ($branchId ?? 'all');

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addMinutes(5), function() use ($now, $month, $year, $branchId) {
            $startDate = \Carbon\Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = $startDate->copy()->endOfMonth();

            // 1. Stats Summary
            $query = Lead::query()->whereBetween('created_at', [$startDate, $endDate]);
            if ($branchId) $query->where('branch_id', $branchId);

            $phaseLookup = LeadPhase::all()->groupBy('code');
            $phases = LeadPhase::orderBy('created_at')->get();
            $phaseStats = $phases->map(function($p) use ($query, $startDate, $endDate, $branchId) {
                // Special case: Enrollment phase should be counted by enrolled_at timestamp
                // to match the Trend Chart and provide an "event-based" monthly report.
                if ($p->code === 'enrollment') {
                    $eQuery = Lead::where('lead_phase_id', $p->id)
                        ->whereBetween('enrolled_at', [$startDate, $endDate]);
                    if ($branchId) $eQuery->where('branch_id', $branchId);
                    
                    return [
                        'name' => $p->name,
                        'code' => $p->code,
                        'status' => $p->status,
                        'count' => $eQuery->count(),
                    ];
                }

                // Standard phases count leads created in this period
                return [
                    'name' => $p->name,
                    'code' => $p->code,
                    'status' => $p->status,
                    'count' => (clone $query)->where('lead_phase_id', $p->id)->count(),
                ];
            });

            $stats = [
                'total' => (clone $query)->count(),
                'phases' => $phaseStats,
            ];

            // 2. Tasks (Manual Tasks + Inactive Lead Reminders)
            $phaseIds = LeadPhase::whereIn('code', ['prospect', 'pre-enrollment'])->pluck('id');

            $manualTasks = Task::with(['lead.leadPhase'])
                ->where('is_completed', false)
                ->where('due_date', '<=', $now->copy()->addDays(7)->toDateString())
                ->get();

            $inactiveLeads = Lead::with(['leadPhase'])
                ->whereIn('lead_phase_id', $phaseIds)
                ->whereBetween('last_activity_at', [
                    $now->copy()->subDays(7)->startOfDay()->toDateTimeString(),
                    $now->copy()->subDays(3)->endOfDay()->toDateTimeString()
                ])
                ->get();

            $tasks = $manualTasks->map(fn($t) => [
                'id' => $t->id,
                'type' => 'manual',
                'lead_id' => $t->lead_id,
                'lead_name' => $t->lead->name ?? 'Unknown',
                'lead_phone' => $t->lead->phone ?? '-',
                'lead_phase_id' => $t->lead->lead_phase_id ?? null,
                'lead_phase_code' => $t->lead->leadPhase->code ?? null,
                'lead_phase_name' => $t->lead->leadPhase->name ?? null,
                'title' => $t->title,
                'fup_count' => $t->lead->follow_up_count ?? 0,
                'due_date' => $t->due_date->format('Y-m-d'),
                'urgency' => $t->due_date->isPast() ? 'Overdue' : ($t->due_date->isToday() ? 'Today' : 'Upcoming'),
            ])->concat($inactiveLeads->map(fn($l) => [
                'id' => 'fup-' . $l->id,
                'type' => 'fup_reminder',
                'lead_id' => $l->id,
                'lead_name' => $l->name,
                'lead_phone' => $l->phone,
                'lead_phase_id' => $l->lead_phase_id,
                'lead_phase_code' => $l->leadPhase->code ?? null,
                'lead_phase_name' => $l->leadPhase->name ?? null,
                'title' => "Follow-up ke-" . (($l->follow_up_count ?? 0) + 1),
                'fup_count' => $l->follow_up_count ?? 0,
                'due_date' => $l->last_activity_at->format('Y-m-d'),
                'urgency' => $now->diffInDays($l->last_activity_at) >= 5 ? 'Overdue' : 'Pending',
            ]))->sortBy(function($t) {
                $priority = $t['urgency'] === 'Overdue' ? 0 : 1;
                return $priority . $t['due_date'];
            })->values();

            // 3. Enrollment Trend (Line Chart - Cumulative)
            $enrollmentTrend = [];
            $daysInMonth = $startDate->daysInMonth;
            
            // "Achieved" is based on Lead's enrolled_at timestamp
            $achievedQuery = Lead::whereNotNull('enrolled_at')
                ->whereBetween('enrolled_at', [$startDate, $endDate]);

            if ($branchId) {
                $achievedQuery->where('branch_id', $branchId);
            }

            $dailyCounts = $achievedQuery->select(DB::raw('DAY(enrolled_at) as day'), DB::raw('count(*) as count'))
                ->groupBy('day')
                ->pluck('count', 'day')
                ->toArray();

            // Calculate Monthly Target for Trend Line
            $targetQuery = MonthlyTarget::where('month', $month)->where('year', $year);
            if ($branchId) {
                $targetQuery->where('branch_id', $branchId);
            }
            $monthlyGoal = (int) $targetQuery->sum('target_enrolled') ?: 0; 

            $cumulative = 0;
            for ($i = 1; $i <= $daysInMonth; $i++) {
                $cumulative += $dailyCounts[$i] ?? 0;
                $enrollmentTrend[] = [
                    'day' => $i,
                    'enrolled' => $cumulative,
                    'target' => $monthlyGoal,
                ];
            }

            return [
                'stats' => $stats,
                'tasks' => $tasks,
                'trend' => $enrollmentTrend,
                'filters' => [
                    'month' => $month,
                    'year' => $year,
                    'branch_id' => $branchId,
                ],
            ];
        });
    }
}
