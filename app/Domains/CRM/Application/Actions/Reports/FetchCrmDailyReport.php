<?php

namespace App\Domains\CRM\Application\Actions\Reports;

use App\Domains\Academic\Domain\Models\PtSession;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadActivity;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\CRM\Domain\Models\LeadRegistration;
use Carbon\Carbon;

class FetchCrmDailyReport
{
    public function handle(string $date, ?string $branchId, $user): array
    {
        $start = Carbon::parse($date)->startOfDay();
        $end = Carbon::parse($date)->endOfDay();
        $isSuperadmin = $user->superadmin()->exists() || $user->hasRole(['superadmin', 'super-admin', 'frontdesk', 'marketing']);

        $targetBranchId = $branchId;
        $targetOwnerId = null;

        if (!$isSuperadmin) {
            $targetOwnerId = $user->id;
            $targetBranchId = $user->branch_id;
        } elseif ($branchId === 'all' || !$branchId) {
            $targetBranchId = null;
        }

        // 1. New Leads
        $newLeadsQuery = Lead::with(['branch', 'leadSource'])
            ->whereBetween('created_at', [$start, $end]);
        if ($targetBranchId) $newLeadsQuery->where('branch_id', $targetBranchId);
        if ($targetOwnerId) $newLeadsQuery->where('owner_id', $targetOwnerId);
        $newLeads = $newLeadsQuery->latest()->get();

        // 2. New Enrollments
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
        $activityQuery = LeadActivity::with(['lead.branch', 'user'])
            ->whereBetween('created_at', [$start, $end]);
        if ($targetOwnerId) {
            $activityQuery->where('user_id', $targetOwnerId);
        } elseif ($targetBranchId) {
            $activityQuery->whereHas('lead', fn($q) => $q->where('branch_id', $targetBranchId));
        }
        $activities = $activityQuery->latest()->get();

        // 4. Placement Tests
        $ptQuery = PtSession::with(['lead.branch', 'ptExam'])
            ->whereBetween('created_at', [$start, $end]);
        if ($targetOwnerId) {
            $ptQuery->whereHas('lead', fn($q) => $q->where('owner_id', $targetOwnerId));
        } elseif ($targetBranchId) {
            $ptQuery->whereHas('lead', fn($q) => $q->where('branch_id', $targetBranchId));
        }
        $ptSessions = $ptQuery->latest()->get();

        // 5. New Registrations
        $regQuery = LeadRegistration::with(['branch'])
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
}
