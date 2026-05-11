<?php

namespace App\Domains\CRM\Application\Services;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Master\Domain\Models\LeadPhase;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class LeadQueryService
{
    /**
     * Get paginated leads based on request filters.
     */
    public function getPaginatedLeads(Request $request, int $perPage = 10): LengthAwarePaginator
    {
        $query = Lead::with(['branch', 'owner', 'leadSource', 'leadType', 'leadPhase']);

        // Handle Filters
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }
        
        if ($request->filled('lead_phase_id')) {
            $query->where('lead_phase_id', $request->lead_phase_id);
        }

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $enrollmentPhase = LeadPhase::where('code', 'enrollment')->first();

        if ($startDate && $endDate) {
            $query->where(function($q) use ($startDate, $endDate, $request, $enrollmentPhase) {
                $dateField = ($request->lead_phase_id == $enrollmentPhase?->id) ? 'enrolled_at' : 'created_at';
                $q->whereBetween($dateField, [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            });
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
                  ->orWhere('lead_number', 'like', "%{$request->search}%");
            });
        }

        return $query->latest()
            ->paginate($perPage)
            ->withQueryString();
    }
}
