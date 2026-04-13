<?php

namespace App\Actions\CRM\Leads;

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

        $userId = Auth::id();
        $userRole = Auth::user()->roles->first()?->name;
        
        // Use a versioned key to mimic tag-based flushing if the store doesn't support tags
        $version = \Illuminate\Support\Facades\Cache::get('crm_dashboard_version', 1);
        $cacheKey = "crm_dashboard_v{$version}_{$year}_{$month}_" . ($branchId ?? 'all') . "_user_{$userId}";

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addMinutes(5), function() use ($now, $month, $year, $branchId, $userRole, $userId) {
            $startDateObj = \Carbon\Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDateObj = $startDateObj->copy()->endOfMonth();

            // Helper to apply role-based filtering
            $applyRoleFilter = function ($query) use ($userRole, $userId) {
                if ($userRole === 'frontdesk') {
                    $query->where(function ($q) use ($userId) {
                        $q->where('created_by', $userId)
                          ->orWhere('owner_id', $userId);
                    });
                }
                return $query;
            };

            // 1. Stats Summary
            $query = Lead::query()->whereBetween('created_at', [$startDateObj, $endDateObj]);
            if ($branchId) $query->where('branch_id', $branchId);
            // $applyRoleFilter($query); // Remove global filter for KPIs

            $phases = LeadPhase::orderBy('created_at')->get();
            $phaseStats = $phases->map(function($p) use ($startDateObj, $endDateObj, $branchId, $applyRoleFilter) {
                // If the phase is 'enrolled', we still want to see activity within the period
                // to match the trend chart (How many were enrolled THIS month)
                if ($p->code === 'enrollment') {
                    $eQuery = Lead::where('lead_phase_id', $p->id)
                        ->whereBetween('enrolled_at', [$startDateObj, $endDateObj]);
                    if ($branchId) $eQuery->where('branch_id', $branchId);
                    
                    return [
                        'name' => $p->name,
                        'code' => $p->code,
                        'status' => $p->status,
                        'count' => $eQuery->count(),
                    ];
                }

                // For all other phases, show the CURRENT snapshot of all active leads
                // to ensure the pipeline breakdown is always accurate
                $sQuery = Lead::where('lead_phase_id', $p->id);
                if ($branchId) $sQuery->where('branch_id', $branchId);

                return [
                    'name' => $p->name,
                    'code' => $p->code,
                    'status' => $p->status,
                    'count' => $sQuery->count(),
                ];
            });

            $stats = [
                'total' => (clone $query)->count(),
                'phases' => $phaseStats,
            ];

            // 2. Tasks (Manual Tasks + Inactive Lead Reminders)
            $phaseIds = LeadPhase::whereIn('code', ['prospect', 'pre-enrollment'])->pluck('id');

            $manualTaskQuery = Task::with(['lead.leadPhase'])
                ->where('is_completed', false)
                ->where('due_date', '<=', $now->copy()->addDays(7)->toDateString());
            
            // Filter tasks by their associated lead ownership
            if ($userRole === 'frontdesk') {
                $manualTaskQuery->whereHas('lead', function($q) use ($userId) {
                    $q->where('created_by', $userId)
                      ->orWhere('owner_id', $userId);
                });
            }
            $manualTasks = $manualTaskQuery->get();

            $inactiveLeadQuery = Lead::with(['leadPhase'])
                ->whereIn('lead_phase_id', $phaseIds)
                ->whereBetween('last_activity_at', [
                    $now->copy()->subDays(7)->startOfDay()->toDateTimeString(),
                    $now->copy()->subDays(3)->endOfDay()->toDateTimeString()
                ]);
            $applyRoleFilter($inactiveLeadQuery);
            $inactiveLeads = $inactiveLeadQuery->get();

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
            $daysInMonth = $startDateObj->daysInMonth;
            
            $achievedQuery = Lead::whereNotNull('enrolled_at')
                ->whereBetween('enrolled_at', [$startDateObj, $endDateObj]);

            if ($branchId) $achievedQuery->where('branch_id', $branchId);
            // $applyRoleFilter($achievedQuery); // Remove global filter for Trend

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
                    'label' => $i,
                    'enrolled' => $cumulative,
                    'target' => $monthlyGoal,
                ];
            }

            return [
                'stats' => $stats,
                'tasks' => $tasks,
                'trend' => $enrollmentTrend,
                'pending_registrations_count' => \App\Models\LeadRegistration::where('status', 'pending')->count(),
                'filters' => [
                    'month' => (int)$month,
                    'year' => (int)$year,
                    'branch_id' => $branchId,
                ],
            ];
        });
    }
}
