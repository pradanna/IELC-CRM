<?php

namespace App\Domains\CRM\Application\Actions\Leads;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\CRM\Domain\Models\Task;
use App\Domains\CRM\Domain\Models\MonthlyTarget;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FetchCrmDashboardData
{
    public function handle(array $filters = []): array
    {
        $now = \Carbon\Carbon::now();
        $month = isset($filters['month']) && $filters['month'] !== '' ? (int)$filters['month'] : null;
        $year = isset($filters['year']) && $filters['year'] !== '' ? (int)$filters['year'] : null;
        $branchId = $filters['branch_id'] ?? null;

        $isFiltered = !is_null($month) && !is_null($year);

        // For trend line and targets, if no filter is active, default to current month
        $trendMonth = $month ?? (int)$now->month;
        $trendYear = $year ?? (int)$now->year;

        $userId = Auth::id();
        $userRole = Auth::user()->roles->first()?->name;
        
        // Use a versioned key to mimic tag-based flushing if the store doesn't support tags
        $version = \Illuminate\Support\Facades\Cache::get('crm_dashboard_version', 1);
        $cacheKey = "crm_dashboard_v{$version}_" . ($year ?? 'all') . "_" . ($month ?? 'all') . "_" . ($branchId ?? 'all') . "_user_{$userId}";

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addMinutes(5), function() use ($now, $month, $year, $trendMonth, $trendYear, $isFiltered, $branchId, $userRole, $userId) {
            $startDateObj = $isFiltered ? \Carbon\Carbon::createFromDate($year, $month, 1)->startOfMonth() : null;
            $endDateObj = $isFiltered ? $startDateObj->copy()->endOfMonth() : null;

            $trendStartDate = \Carbon\Carbon::createFromDate($trendYear, $trendMonth, 1)->startOfMonth();
            $trendEndDate = $trendStartDate->copy()->endOfMonth();

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
            $query = Lead::query();
            if ($isFiltered) {
                $query->whereBetween('created_at', [$startDateObj, $endDateObj]);
            }
            if ($branchId) $query->where('branch_id', $branchId);

            $phases = LeadPhase::orderBy('created_at')->get();
            $phaseStats = $phases->map(function($p) use ($startDateObj, $endDateObj, $branchId, $isFiltered) {
                $sQuery = Lead::where('lead_phase_id', $p->id);
                if ($branchId) $sQuery->where('branch_id', $branchId);

                if ($isFiltered) {
                    switch ($p->code) {
                        case 'lead':
                            $sQuery->whereBetween('created_at', [$startDateObj, $endDateObj]);
                            break;
                        case 'prospect':
                            $sQuery->whereBetween('reached_prospective_at', [$startDateObj, $endDateObj]);
                            break;
                        case 'consultation':
                            $sQuery->whereBetween('first_consultation_at', [$startDateObj, $endDateObj]);
                            break;
                        case 'placement-test':
                            $sQuery->whereBetween('first_pt_at', [$startDateObj, $endDateObj]);
                            break;
                        case 'enrollment':
                            $sQuery->whereBetween('enrolled_at', [$startDateObj, $endDateObj]);
                            break;
                        case 'cold-leads':
                        case 'dropout-leads':
                            $sQuery->whereBetween('lost_at', [$startDateObj, $endDateObj]);
                            break;
                        default:
                            $sQuery->whereBetween('updated_at', [$startDateObj, $endDateObj]);
                            break;
                    }
                }

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

            $fupMax = (int) \App\Domains\CRM\Domain\Models\CrmSetting::get('fup_max_attempts', 7);
            $fupTrigger = (int) \App\Domains\CRM\Domain\Models\CrmSetting::get('fup_task_trigger_days', 4);

            $silentLeadsQuery = Lead::with(['leadPhase'])
                ->whereHas('leadPhase', fn($q) => $q->where('status', 'prospective'))
                ->where('follow_up_count', '<', $fupMax)
                ->whereBetween('last_activity_at', [
                    $now->copy()->subDays(30)->startOfDay()->toDateTimeString(), // Hard cap 30 days
                    $now->copy()->subDays($fupTrigger)->endOfDay()->toDateTimeString()
                ]);
            $applyRoleFilter($silentLeadsQuery);
            $silentLeads = $silentLeadsQuery->get();

            $newLeadsQuery = Lead::with(['leadPhase'])
                ->whereHas('leadPhase', fn($q) => $q->where('code', 'lead'))
                ->where('follow_up_count', 0);
            $applyRoleFilter($newLeadsQuery);
            $newLeads = $newLeadsQuery->get();

            $manualTasksMapped = $manualTasks->map(function($t) use ($now) {
                $dueDate = $t->due_date;
                $isPast = $dueDate->isPast() && !$dueDate->isToday();
                $isToday = $dueDate->isToday();

                if ($isPast) {
                    $days = $now->startOfDay()->diffInDays($dueDate->copy()->startOfDay());
                    $urgencyLabel = "Terlambat {$days} hari";
                    $urgencyLevel = 'danger';
                } elseif ($isToday) {
                    $urgencyLabel = "Hari Ini";
                    $urgencyLevel = 'warning';
                } else {
                    $urgencyLabel = "Mendatang";
                    $urgencyLevel = 'info';
                }

                return [
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
                    'due_date' => $dueDate->format('Y-m-d'),
                    'urgency_label' => $urgencyLabel,
                    'urgency_level' => $urgencyLevel,
                ];
            });

            $fupReminders = $silentLeads->map(function($l) use ($now, $fupTrigger) {
                if ($l->last_activity_at->isToday()) {
                    $urgencyLabel = "Perlu follow-up (Hari Ini)";
                    $urgencyLevel = 'warning';
                } elseif ($l->last_activity_at->isYesterday()) {
                    $urgencyLabel = "Perlu follow-up (Kemarin)";
                    $urgencyLevel = 'warning';
                } else {
                    $days = $now->startOfDay()->diffInDays($l->last_activity_at->copy()->startOfDay());
                    $isOverdue = $days >= ($fupTrigger + 2);

                    if ($isOverdue) {
                        $urgencyLabel = "Belum difollow {$days} hari";
                        $urgencyLevel = 'danger';
                    } else {
                        $urgencyLabel = "Perlu follow-up ({$days} hari diam)";
                        $urgencyLevel = 'warning';
                    }
                }

                return [
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
                    'urgency_label' => $urgencyLabel,
                    'urgency_level' => $urgencyLevel,
                ];
            });

            $newLeadsMapped = $newLeads->map(function($l) use ($now) {
                if ($l->created_at->isToday()) {
                    $urgencyLabel = "Lead Baru (Hari Ini)";
                    $urgencyLevel = 'danger';
                } elseif ($l->created_at->isYesterday()) {
                    $urgencyLabel = "Lead Baru (Kemarin)";
                    $urgencyLevel = 'danger';
                } else {
                    $days = $now->startOfDay()->diffInDays($l->created_at->copy()->startOfDay());
                    $urgencyLabel = "Lead Baru ({$days} hari belum difollow)";
                    $urgencyLevel = 'danger';
                }

                return [
                    'id' => 'new-' . $l->id,
                    'type' => 'new_lead',
                    'lead_id' => $l->id,
                    'lead_name' => $l->name,
                    'lead_phone' => $l->phone,
                    'lead_phase_id' => $l->lead_phase_id,
                    'lead_phase_code' => $l->leadPhase->code ?? null,
                    'lead_phase_name' => $l->leadPhase->name ?? null,
                    'title' => "Follow-up Pertama",
                    'fup_count' => 0,
                    'due_date' => $l->created_at->format('Y-m-d'),
                    'urgency_label' => $urgencyLabel,
                    'urgency_level' => $urgencyLevel,
                ];
            });

            $tasks = $manualTasksMapped
                ->concat($fupReminders)
                ->concat($newLeadsMapped)
                ->sortBy(function($t) {
                    $priority = $t['urgency_level'] === 'danger' ? 0 : ($t['urgency_level'] === 'warning' ? 1 : 2);
                    return $priority . $t['due_date'];
                })
                ->values();

            // 3. Enrollment Trend (Line Chart - Cumulative)
            $enrollmentTrend = [];
            $daysInMonth = $trendStartDate->daysInMonth;
            
            $achievedQuery = Lead::whereNotNull('enrolled_at')
                ->whereBetween('enrolled_at', [$trendStartDate, $trendEndDate]);

            if ($branchId) $achievedQuery->where('branch_id', $branchId);

            $dailyCounts = $achievedQuery->select(DB::raw('DAY(enrolled_at) as day'), DB::raw('count(*) as count'))
                ->groupBy('day')
                ->pluck('count', 'day')
                ->toArray();

            // Calculate Monthly Target for Trend Line
            $targetQuery = MonthlyTarget::where('month', $trendMonth)->where('year', $trendYear);
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
                'trend' => $enrollmentTrend ?? [],
                'expiringStudents' => (new FetchExpiringStudents())->execute(14, $branchId),
                'pending_registrations_count' => \App\Domains\CRM\Domain\Models\LeadRegistration::where('status', 'pending')->count(),
                'filters' => [
                    'month' => $month,
                    'year' => $year,
                    'branch_id' => $branchId,
                ],
                'success_rates' => $this->calculateSuccessRates($startDateObj, $endDateObj, $branchId, $applyRoleFilter, $isFiltered),
            ];
        });
    }

    private function calculateSuccessRates($startDate, $endDate, $branchId, $applyRoleFilter, $isFiltered): array
    {
        $cohortQuery = Lead::query();
        if ($isFiltered) {
            $cohortQuery->whereBetween('created_at', [$startDate, $endDate]);
        }
        if ($branchId) $cohortQuery->where('branch_id', $branchId);
        $applyRoleFilter($cohortQuery);

        $totalLeads = (clone $cohortQuery)->count();

        if ($totalLeads === 0) {
            return [
                'new_to_prospective' => ['count' => 0, 'total' => 0, 'percentage' => 0],
                'prospective_to_consultation' => ['count' => 0, 'total' => 0, 'percentage' => 0],
                'consultation_to_pt' => ['count' => 0, 'total' => 0, 'percentage' => 0],
                'pt_to_closing' => ['count' => 0, 'total' => 0, 'percentage' => 0],
                'new_to_closing' => ['count' => 0, 'total' => 0, 'percentage' => 0],
                'prospective_to_closing' => ['count' => 0, 'total' => 0, 'percentage' => 0],
                'consultation_to_closing' => ['count' => 0, 'total' => 0, 'percentage' => 0],
            ];
        }

        $leads = (clone $cohortQuery)->get();

        $reachedProspectiveCount = $leads->filter(fn($l) => !is_null($l->reached_prospective_at))->count();
        $consultationCount = $leads->filter(fn($l) => !is_null($l->first_consultation_at))->count();
        $ptCount = $leads->filter(fn($l) => !is_null($l->first_pt_at))->count();
        $closingCount = $leads->filter(fn($l) => !is_null($l->enrolled_at))->count();

        return [
            'new_to_prospective' => [
                'count' => $reachedProspectiveCount,
                'total' => $totalLeads,
                'percentage' => round(($reachedProspectiveCount / $totalLeads) * 100, 1)
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
                'count' => $closingCount,
                'total' => $ptCount,
                'percentage' => $ptCount > 0 ? round(($closingCount / $ptCount) * 100, 1) : 0
            ],
            'new_to_closing' => [
                'count' => $closingCount,
                'total' => $totalLeads,
                'percentage' => round(($closingCount / $totalLeads) * 100, 1)
            ],
            'prospective_to_closing' => [
                'count' => $closingCount,
                'total' => $reachedProspectiveCount,
                'percentage' => $reachedProspectiveCount > 0 ? round(($closingCount / $reachedProspectiveCount) * 100, 1) : 0
            ],
            'consultation_to_closing' => [
                'count' => $closingCount,
                'total' => $consultationCount,
                'percentage' => $consultationCount > 0 ? round(($closingCount / $consultationCount) * 100, 1) : 0
            ],
        ];
    }


}



