<?php

namespace App\Http\Controllers\Admin\CRM;

use App\Actions\Admin\CRM\StoreLead;
use App\Actions\Admin\CRM\UpdateLead;
use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\Province;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

use App\Models\Lead;
use App\Models\Branch;
use App\Models\LeadSource;
use App\Models\LeadType;
use App\Http\Resources\CRM\LeadResource;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Lead::with(['branch', 'owner', 'leadSource', 'leadType', 'leadPhase']);

        // Handle Filters
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }
        
        if ($request->filled('lead_phase_id')) {
            $query->where('lead_phase_id', $request->lead_phase_id);
        }

        if ($request->filled('month')) {
            $query->whereMonth('created_at', $request->month);
        }

        if ($request->filled('year')) {
            $query->whereYear('created_at', $request->year);
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
                  ->orWhere('lead_number', 'like', "%{$request->search}%");
            });
        }

        $leads = $query->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/CRM/ListView', [
            'leads' => LeadResource::collection($leads),
            'filters' => $request->only(['branch_id', 'lead_phase_id', 'month', 'year', 'search']),
            'branches' => Branch::select('id', 'name')->get(),
            'phases' => \App\Models\LeadPhase::select('id', 'name')->get(),
            'sources' => LeadSource::select('id', 'name')->get(),
            'types' => LeadType::select('id', 'name')->get(),
            'provinces' => Province::select('id', 'name')->orderBy('name')->get(),
            'chatTemplates' => \App\Models\ChatTemplate::with(['leadPhases', 'leadTypes'])->latest()->get(),
            'mediaAssets'   => \App\Models\MediaAsset::latest()->get(),
        ]);
    }

    public function show(Lead $lead): JsonResponse
    {
        return response()->json([
            'lead' => new LeadResource($lead->load([
                'branch', 'owner', 'leadSource', 'leadType', 'leadPhase', 
                'guardians', 'leadRelationships.relatedLead'
            ]))
        ]);
    }

    public function store(\App\Http\Requests\CRM\StoreLeadRequest $request): RedirectResponse
    {
        $lead = (new StoreLead)->handle($request->validated());
        
        $this->clearDashboardCache($lead);

        return redirect()->back()->with([
            'success' => 'Lead created successfully.',
            'newLeadId' => $lead->id
        ]);
    }

    public function activities(Lead $lead): JsonResponse
    {
        $activities = $lead->activities()->with('causer')->latest()->paginate(10);
        
        return response()->json([
            'activities' => \App\Http\Resources\CRM\LeadActivityResource::collection($activities),
            'pagination' => [
                'current_page' => $activities->currentPage(),
                'last_page'    => $activities->lastPage(),
                'has_more'     => $activities->hasMorePages(),
            ]
        ]);
    }

    public function update(\App\Http\Requests\CRM\UpdateLeadRequest $request, Lead $lead): RedirectResponse
    {
        (new UpdateLead)->handle($lead, $request->validated());

        return redirect()->back()->with('success', 'Lead updated successfully.');
    }

    public function updatePhase(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'lead_phase_id' => ['required', 'exists:lead_phases,id'],
        ]);

        $lead->update([
            'lead_phase_id' => $validated['lead_phase_id'],
            'last_activity_at' => now(),
        ]);

        $lead->load(['branch', 'owner', 'leadSource', 'leadType', 'leadPhase', 'guardians', 'leadRelationships.relatedLead']);

        $this->clearDashboardCache($lead);

        return response()->json([
            'message' => 'Lead phase updated successfully.',
            'lead' => new LeadResource($lead),
        ]);
    }

    public function recordFollowUp(Request $request, Lead $lead): JsonResponse
    {
        $lead->increment('follow_up_count');
        $lead->update(['last_activity_at' => now()]);

        $fupText = "Follow-up #" . $lead->follow_up_count;
        $chatSnippet = $request->input('message') ? ': "' . \Illuminate\Support\Str::limit($request->message, 100) . '"' : '';
        $message = "[$fupText]$chatSnippet";

        // Automation: 4x Follow-up -> Cold Leads (if not already in a terminal phase)
        $lostPhase = \App\Models\LeadPhase::where('code', 'cold-leads')->first();
        if ($lead->follow_up_count >= 4 && $lostPhase && $lead->lead_phase_id !== $lostPhase->id) {
            $lead->update(['lead_phase_id' => $lostPhase->id]);
            $message .= " | Otomatis masuk ke Cold Leads.";
        }

        // Standard Spatie Log for UI visibility
        activity()
            ->performedOn($lead)
            ->causedBy(auth()->user())
            ->log($message);

        $this->clearDashboardCache($lead);

        return response()->json([
            'message' => 'Follow-up recorded successfully.',
            'lead' => new LeadResource($lead->load(['leadPhase'])),
        ]);
    }

    public function resetFollowUp(Lead $lead): JsonResponse
    {
        if ($lead->follow_up_count > 0) {
            $lead->update(['follow_up_count' => 0]);
            
            activity()
                ->performedOn($lead)
                ->log("Follow-up counter reset to 0 (Lead responded)");

            $this->clearDashboardCache($lead);
        }

        return response()->json([
            'message' => 'Follow-up reset successfully.',
            'lead' => new LeadResource($lead->load(['leadPhase'])),
        ]);
    }

    public function destroy(Lead $lead): RedirectResponse
    {
        abort_unless(auth()->user()->hasRole('superadmin'), 403, 'Unauthorized action.');
        
        $lead->delete();

        return redirect()->back()->with('success', 'Lead deleted successfully.');
    }

    public function getCities(Request $request): JsonResponse
    {
        $provinceName = $request->query('province');
        
        if (!$provinceName) {
            return response()->json([]);
        }

        $province = Province::where('name', $provinceName)->first();

        if (!$province) {
            return response()->json([]);
        }

        $cities = City::where('province_id', $province->id)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json($cities);
    }

    public function getRelatables(Request $request): JsonResponse
    {
        $search = $request->query('search');
        
        $leads = Lead::query()
            ->when($search, function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('lead_number', 'like', "%{$search}%");
            })
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($lead) => [
                'value' => $lead->id,
                'label' => "{$lead->name} ({$lead->lead_number})"
            ]);

        return response()->json($leads);
    }

    public function quickSearch(Request $request): JsonResponse
    {
        $search = $request->query('q');
        
        if (!$search || strlen($search) < 2) {
            return response()->json([]);
        }

        $leads = Lead::query()
            ->with('branch:id,name')
            ->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('lead_number', 'like', "%{$search}%");
            })
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($lead) => [
                'id' => $lead->id,
                'name' => $lead->name,
                'phone' => $lead->phone,
                'lead_number' => $lead->lead_number,
                'branch_name' => $lead->branch?->name,
            ]);

        return response()->json($leads);
    }

    public function kanban(Request $request): Response
    {
        $phases = \App\Models\LeadPhase::orderBy('created_at', 'asc')->get();
        
        $leadsQuery = Lead::with(['branch', 'owner', 'leadSource', 'leadType', 'leadPhase']);

        // Default to current month and year if not specified
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        // Apply same filters as Index/List
        if ($request->filled('branch_id')) {
            $leadsQuery->where('branch_id', $request->branch_id);
        }

        $leadsQuery->whereMonth('created_at', $month);
        $leadsQuery->whereYear('created_at', $year);

        if ($request->filled('search')) {
            $leadsQuery->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
                  ->orWhere('lead_number', 'like', "%{$request->search}%");
            });
        }

        $leads = $leadsQuery->latest()->get();

        // Group leads by phase for the Kanban Board
        $kanbanData = $phases->map(function($phase) use ($leads) {
            return [
                'id' => $phase->id,
                'name' => $phase->name,
                'leads' => LeadResource::collection($leads->where('lead_phase_id', $phase->id)->values()),
            ];
        });

        return Inertia::render('Admin/CRM/KanbanView', [
            'kanbanData' => $kanbanData,
            'filters' => array_merge($request->only(['branch_id', 'search']), [
                'month' => (int)$month,
                'year' => (int)$year,
            ]),
            'branches' => Branch::select('id', 'name')->get(),
            'phases' => $phases,
            'sources' => LeadSource::select('id', 'name')->get(),
            'types' => LeadType::select('id', 'name')->get(),
            'chatTemplates' => \App\Models\ChatTemplate::with(['leadPhases', 'leadTypes'])->latest()->get(),
            'mediaAssets'   => \App\Models\MediaAsset::latest()->get(),
        ]);
    }

    private function clearDashboardCache(Lead $lead): void
    {
        $year = $lead->created_at->year;
        $month = $lead->created_at->month;
        $branchId = $lead->branch_id;
        
        \Illuminate\Support\Facades\Cache::forget("crm_dashboard_data_{$year}_{$month}_{$branchId}");
        \Illuminate\Support\Facades\Cache::forget("crm_dashboard_data_{$year}_{$month}_all");
        
        $now = now();
        \Illuminate\Support\Facades\Cache::forget("crm_dashboard_data_{$now->year}_{$now->month}_{$branchId}");
        \Illuminate\Support\Facades\Cache::forget("crm_dashboard_data_{$now->year}_{$now->month}_all");
    }
}
