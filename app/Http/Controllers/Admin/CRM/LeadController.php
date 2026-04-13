<?php

namespace App\Http\Controllers\Admin\CRM;

use App\Actions\CRM\Leads\FetchLeadHistory;
use App\Actions\CRM\Leads\PlotLeadClass;
use App\Actions\CRM\Leads\RecordLeadFollowUp;
use App\Actions\CRM\Leads\ResetLeadFollowUp;
use App\Actions\CRM\Leads\SendLeadWhatsApp;
use App\Actions\CRM\Leads\SendLeadWhatsAppTemplate;
use App\Actions\CRM\Leads\StoreLead;
use App\Actions\CRM\Leads\UpdateLead;
use App\Actions\CRM\Leads\UpdateLeadPhase;
use App\Actions\CRM\Leads\StoreLeadConsultation;
use App\Http\Controllers\Controller;
use App\Http\Requests\CRM\PlotLeadClassRequest;
use App\Http\Requests\CRM\RecordLeadFollowUpRequest;
use App\Http\Requests\CRM\SendLeadWhatsAppRequest;
use App\Http\Requests\CRM\SendLeadWhatsAppTemplateRequest;
use App\Http\Requests\CRM\StoreLeadRequest;
use App\Http\Requests\CRM\UpdateLeadPhaseRequest;
use App\Http\Requests\CRM\UpdateLeadRequest;
use App\Http\Requests\CRM\StoreConsultationRequest;
use App\Models\Branch;
use App\Models\ChatTemplate;
use App\Models\Lead;
use App\Models\LeadPhase;
use App\Models\LeadSource;
use App\Models\LeadType;
use App\Models\MediaAsset;
use App\Models\Province;
use App\Models\City;
use App\Models\StudyClass;
use App\Models\PtExam;
use App\Http\Resources\CRM\LeadResource;
use App\Http\Resources\CRM\LeadActivityResource;
use App\Http\Resources\CRM\PtExam\PtExamResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
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

        $targetMonth = $request->input('month');
        $targetYear  = $request->input('year');
        $enrollmentPhase = LeadPhase::where('code', 'enrollment')->first();

        if ($targetMonth && $targetYear) {
            $query->where(function($q) use ($targetMonth, $targetYear, $request, $enrollmentPhase) {
                if ($request->lead_phase_id == $enrollmentPhase?->id) {
                    $q->whereMonth('enrolled_at', $targetMonth)
                      ->whereYear('enrolled_at', $targetYear);
                } else {
                    $q->whereMonth('created_at', $targetMonth)
                      ->whereYear('created_at', $targetYear);
                }
            });
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

        return Inertia::render('Admin/CRM/Leads/Index', [
            'leads' => LeadResource::collection($leads),
            'filters' => $request->only(['branch_id', 'lead_phase_id', 'month', 'year', 'search']),
            'branches' => Branch::select('id', 'name')->get(),
            'phases' => LeadPhase::select('id', 'name', 'code')->get(),
            'sources' => LeadSource::select('id', 'name')->get(),
            'types' => LeadType::select('id', 'name')->get(),
            'provinces' => Province::select('id', 'name')->orderBy('name')->get(),
            'chatTemplates' => ChatTemplate::with(['leadPhases', 'leadTypes'])->latest()->get(),
            'mediaAssets'   => MediaAsset::latest()->get(),
            'pending_registrations_count' => \App\Models\LeadRegistration::where('status', 'pending')->count(),
        ]);
    }

    public function show(Lead $lead): JsonResponse
    {
        try {
            // Load available classes for this specific branch
            $availableClasses = StudyClass::where('branch_id', $lead->branch_id)
                ->with(['instructor:id,name', 'priceMaster:id,name,price_per_session'])
                ->where(function($q) {
                    $q->whereNull('end_session_date')
                      ->orWhere('end_session_date', '>=', now()->startOfDay());
                })
                ->latest()
                ->get();

            return response()->json([
                'lead' => new LeadResource($lead->load([
                    'branch', 'owner', 'leadSource', 'leadType', 'leadPhase', 
                    'guardians', 'leadRelationships.relatedLead', 
                    'ptSessions.ptExam',
                    'consultations.consultant',
                    'invoices.items',
                    'student.studyClasses',
                    'chatLogs.sender',
                ])),
                'availableExams' => PtExamResource::collection(\App\Models\PtExam::where('is_active', true)->get()),
                'availableClasses' => StudyClassResource::collection($availableClasses),
                'chatTemplates'  => \App\Models\ChatTemplate::with(['leadPhases', 'leadTypes'])->get(),
                'phases'         => LeadPhase::orderBy('created_at', 'asc')->get(),
                'mediaAssets'    => \App\Models\MediaAsset::latest()->get(),
            ]);
        } catch (\Exception $e) {
            \Log::error("Error in LeadController@show: " . $e->getMessage());
            return response()->json(['error' => 'Failed to load lead details: ' . $e->getMessage()], 500);
        }
    }

    public function activities(Lead $lead, FetchLeadHistory $action): JsonResponse
    {
        return response()->json([
            'activities' => $action->handle($lead)
        ]);
    }

    public function plotClass(PlotLeadClassRequest $request, Lead $lead, PlotLeadClass $action): JsonResponse
    {
        $lead = $action->handle($lead, $request->validated());

        return response()->json([
            'message' => 'Lead plotting updated.',
            'lead' => new LeadResource($lead->load(['student.studyClasses']))
        ]);
    }

    public function sendMessage(SendLeadWhatsAppRequest $request, Lead $lead, SendLeadWhatsApp $action): JsonResponse
    {
        try {
            $action->handle($lead, $request->validated());
            return response()->json(['message' => 'Message sent and logged.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to send WhatsApp: ' . $e->getMessage()], 500);
        }
    }

    public function sendTemplate(SendLeadWhatsAppTemplateRequest $request, Lead $lead, SendLeadWhatsAppTemplate $action): JsonResponse
    {
        try {
            $action->handle($lead, $request->validated());
            return response()->json(['message' => 'Template sent effectively.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to send WhatsApp: ' . $e->getMessage()], 500);
        }
    }

    public function store(StoreLeadRequest $request, StoreLead $action): RedirectResponse
    {
        $lead = $action->handle($request->validated());
        $this->clearDashboardCache();

        return redirect()->back()->with([
            'success' => 'Lead created successfully.',
            'newLeadId' => $lead->id
        ]);
    }

    public function update(UpdateLeadRequest $request, Lead $lead, UpdateLead $action): RedirectResponse
    {
        $action->handle($lead, $request->validated());
        return redirect()->back()->with('success', 'Lead updated successfully.');
    }

    public function updatePhase(UpdateLeadPhaseRequest $request, Lead $lead, UpdateLeadPhase $action): JsonResponse
    {
        $lead = $action->handle($lead, $request->validated());
        $this->clearDashboardCache();

        return response()->json([
            'message' => 'Lead phase updated successfully.',
            'lead' => new LeadResource($lead->load([
                'branch', 'owner', 'leadPhase', 'student.studyClasses', 'chatLogs.sender'
            ])),
        ]);
    }

    public function recordFollowUp(RecordLeadFollowUpRequest $request, Lead $lead, RecordLeadFollowUp $action): JsonResponse
    {
        $lead = $action->handle($lead, $request->validated());
        $this->clearDashboardCache();

        return response()->json([
            'message' => 'Follow-up recorded successfully.',
            'lead' => new LeadResource($lead->load(['leadPhase', 'chatLogs.sender'])),
        ]);
    }

    public function resetFollowUp(Lead $lead, ResetLeadFollowUp $action): JsonResponse
    {
        $lead = $action->handle($lead);
        $this->clearDashboardCache();

        return response()->json([
            'message' => 'Follow-up reset successfully.',
            'lead' => new LeadResource($lead->load(['leadPhase', 'chatLogs.sender'])),
        ]);
    }

    public function storeConsultation(\App\Http\Requests\CRM\StoreConsultationRequest $request, Lead $lead, StoreLeadConsultation $action): JsonResponse
    {
        $consultation = $action->handle($lead, $request->validated());

        return response()->json([
            'message' => 'Consultation recorded successfully.',
            'consultation' => $consultation,
            'lead' => new LeadResource($lead->load('consultations.consultant')),
        ]);
    }

    public function destroy(Lead $lead): RedirectResponse
    {
        abort_unless(auth()->user()->hasRole('superadmin'), 403, 'Unauthorized action.');
        $lead->delete();
        $this->clearDashboardCache();
        return redirect()->back()->with('success', 'Lead deleted successfully.');
    }

    public function getCities(Request $request): JsonResponse
    {
        $provinceName = $request->query('province');
        if (!$provinceName) return response()->json([]);
        $province = \App\Models\Province::where('name', $provinceName)->first();
        if (!$province) return response()->json([]);

        $cities = \App\Models\City::where('province_id', $province->id)
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
            ->get();

        return response()->json(LeadResource::collection($leads)->map(fn($l) => [
            'value' => $l->id,
            'label' => "{$l->name} ({$l->lead_number})"
        ]));
    }

    public function quickSearch(Request $request): JsonResponse
    {
        $search = $request->query('q');
        if (!$search || strlen($search) < 2) return response()->json([]);

        $leads = Lead::query()
            ->with('branch:id,name')
            ->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('lead_number', 'like', "%{$search}%");
            })
            ->latest()
            ->limit(5)
            ->get();

        return response()->json(LeadResource::collection($leads)->map(fn($l) => [
            'id' => $l->id,
            'name' => $l->name,
            'phone' => $l->phone,
            'lead_number' => $l->lead_number,
            'branch_name' => $l->branch?->name,
        ]));
    }

    public function kanban(Request $request): Response
    {
        $phases = LeadPhase::orderBy('created_at', 'asc')->get();
        $leadsQuery = Lead::with(['branch', 'owner', 'leadSource', 'leadType', 'leadPhase']);

        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        if ($request->filled('branch_id')) {
            $leadsQuery->where('branch_id', $request->branch_id);
        }

        $leadsQuery->where(function($q) use ($month, $year) {
            $q->where(function($sub) use ($month, $year) {
                $sub->whereMonth('created_at', $month)
                    ->whereYear('created_at', $year);
            })->orWhere(function($sub) use ($month, $year) {
                $sub->whereMonth('enrolled_at', $month)
                    ->whereYear('enrolled_at', $year);
            });
        });

        if ($request->filled('search')) {
            $leadsQuery->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
                  ->orWhere('lead_number', 'like', "%{$request->search}%");
            });
        }

        $leads = $leadsQuery->latest()->get();

        $kanbanData = $phases->map(function($phase) use ($leads, $month, $year) {
            $columnLeads = $leads->where('lead_phase_id', $phase->id);
            if ($phase->code === 'enrollment') {
                $columnLeads = $columnLeads->filter(function($l) use ($month, $year) {
                    return $l->enrolled_at && 
                           $l->enrolled_at->month == $month && 
                           $l->enrolled_at->year == $year;
                });
            }

            return [
                'id' => $phase->id,
                'name' => $phase->name,
                'leads' => LeadResource::collection($columnLeads->values()),
            ];
        });

        return Inertia::render('Admin/CRM/Leads/Kanban', [
            'kanbanData' => $kanbanData,
            'filters' => array_merge($request->only(['branch_id', 'search']), [
                'month' => (int)$month,
                'year' => (int)$year,
            ]),
            'branches' => Branch::select('id', 'name')->get(),
            'phases' => $phases,
            'sources' => LeadSource::select('id', 'name')->get(),
            'types' => LeadType::select('id', 'name')->get(),
            'chatTemplates' => ChatTemplate::with(['leadPhases', 'leadTypes'])->latest()->get(),
            'mediaAssets'   => MediaAsset::latest()->get(),
            'pending_registrations_count' => \App\Models\LeadRegistration::where('status', 'pending')->count(),
        ]);
    }

    private function clearDashboardCache(): void
    {
        $version = Cache::get('crm_dashboard_version', 1);
        Cache::put('crm_dashboard_version', $version + 1, now()->addYear());
    }
}
