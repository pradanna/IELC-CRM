<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Domains\CRM\Application\Actions\Leads\AddLeadEnrollment;
use App\Domains\CRM\Application\Actions\Leads\FetchLeadHistory;
use App\Domains\CRM\Application\Actions\Leads\PlotLeadClass;
use App\Domains\CRM\Application\Actions\Leads\RecordLeadFollowUp;
use App\Domains\CRM\Application\Actions\Leads\ResetLeadFollowUp;
use App\Domains\CRM\Application\Actions\Leads\SendLeadWhatsApp;
use App\Domains\CRM\Application\Actions\Leads\SendLeadWhatsAppTemplate;
use App\Domains\CRM\Application\Actions\Leads\StoreLead;
use App\Domains\CRM\Application\Actions\Leads\UpdateLead;
use App\Domains\CRM\Application\Actions\Leads\UpdateLeadPhase;
use App\Domains\CRM\Application\Actions\Leads\StoreLeadConsultation;
use App\Domains\CRM\Application\Services\LeadQueryService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Crm\PlotLeadClassRequest;
use App\Http\Requests\Crm\RecordLeadFollowUpRequest;
use App\Http\Requests\Crm\SendLeadWhatsAppRequest;
use App\Http\Requests\Crm\SendLeadWhatsAppTemplateRequest;
use App\Http\Requests\Crm\StoreLeadRequest;
use App\Http\Requests\Crm\UpdateLeadPhaseRequest;
use App\Http\Requests\Crm\UpdateLeadRequest;
use App\Http\Requests\Crm\StoreConsultationRequest;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\ChatTemplate;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\Master\Domain\Models\LeadSource;
use App\Domains\Master\Domain\Models\InfoSource;
use App\Domains\Master\Domain\Models\LeadType;
use App\Domains\Master\Domain\Models\MediaAsset;
use App\Domains\Master\Domain\Models\Province;
use App\Domains\Master\Domain\Models\City;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\Academic\Domain\Models\PtExam;
use App\Http\Resources\Crm\LeadResource;
use App\Http\Resources\Crm\LeadActivityResource;
use App\Http\Resources\Crm\PtExam\PtExamResource;
use App\Http\Resources\Crm\LeadPhaseResource;
use App\Http\Resources\Crm\LeadSourceResource;
use App\Http\Resources\Crm\InfoSourceResource;
use App\Http\Resources\Crm\LeadTypeResource;
use App\Http\Resources\Master\BranchResource;
use App\Http\Resources\Academic\StudyClassResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function index(Request $request, LeadQueryService $service): Response|RedirectResponse
    {
        if (auth()->user()?->hasRole('finance')) {
            return redirect()->route('admin.finance.dashboard');
        }

        $leads = $service->getPaginatedLeads($request);

        return Inertia::render('Admin/Crm/Leads/Index', [
            'leads' => LeadResource::collection($leads),
            'filters' => $request->only(['branch_id', 'lead_phase_id', 'start_date', 'end_date', 'search']),
            'branches' => BranchResource::collection(Branch::select('id', 'name')->get()),
            'phases' => LeadPhaseResource::collection(LeadPhase::select('id', 'name', 'code')->get()),
            'sources' => LeadSourceResource::collection(LeadSource::select('id', 'name')->get()),
            'infoSources' => InfoSourceResource::collection(InfoSource::select('id', 'name')->get()),
            'types' => LeadTypeResource::collection(LeadType::select('id', 'name')->get()),
            'provinces' => Province::select('id', 'name')->orderBy('name')->get(),
            'chatTemplates' => ChatTemplate::with(['leadPhases', 'leadTypes'])->latest()->get(),
            'mediaAssets'   => MediaAsset::latest()->get(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        try {
            $lead = Lead::withTrashed()->findOrFail($id);

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
                    'branch', 'owner', 'leadSource', 'infoSource', 'leadType', 'leadPhase', 
                    'guardians', 'leadRelationships.relatedLead', 
                    'ptSessions.ptExam',
                    'consultations.consultant',
                    'invoices.items',
                    'student.studyClasses',
                    'chatLogs.sender',
                    'notes.user',
                    'activities.user',
                    'enrollments.studyClass', 'enrollments.invoice',
                ])),
                'availableExams' => PtExamResource::collection(\App\Domains\Academic\Domain\Models\PtExam::where('is_active', true)->get()),
                'availableClasses' => StudyClassResource::collection($availableClasses),
                'priceMasters'   => \App\Domains\Finance\Domain\Models\PriceMaster::all(),
                'chatTemplates'  => \App\Domains\Master\Domain\Models\ChatTemplate::with(['leadPhases', 'leadTypes'])->get(),
                'phases'         => LeadPhase::orderBy('created_at', 'asc')->get(),
                'mediaAssets'    => \App\Domains\Master\Domain\Models\MediaAsset::latest()->get(),
                'leadTypes'      => LeadTypeResource::collection(LeadType::select('id', 'name')->get()),
                'leadSources'    => \App\Domains\Master\Domain\Models\LeadSource::select('id', 'name')->get(),
                'provinces'      => Province::select('id', 'name')->orderBy('name')->get(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Lead not found.'], 404);
        } catch (\Exception $e) {
            \Log::error("Error in LeadController@show: " . $e->getMessage());
            return response()->json(['error' => 'Failed to load lead details: ' . $e->getMessage()], 500);
        }
    }

    public function activities(Lead $lead, FetchLeadHistory $action): JsonResponse
    {
        $paginated = $action->handle($lead);

        return response()->json([
            'activities' => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'has_more'     => $paginated->hasMorePages(),
            ]
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

    public function addEnrollment(Request $request, Lead $lead, AddLeadEnrollment $action): JsonResponse
    {
        $validated = $request->validate([
            'study_class_id' => ['required', 'uuid', 'exists:study_classes,id'],
            'join_date'      => ['nullable', 'date'],
            'notes'          => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $enrollment = $action->handle($lead, $validated);

            $lead->refresh()->load([
                'branch', 'owner', 'leadSource', 'infoSource', 'leadType', 'leadPhase',
                'guardians', 'leadRelationships.relatedLead',
                'ptSessions.ptExam',
                'consultations.consultant',
                'invoices.items',
                'student.studyClasses',
                'chatLogs.sender',
                'notes.user',
                'activities.user',
                'enrollments.studyClass', 'enrollments.invoice',
            ]);

            return response()->json([
                'message'    => 'Pengajuan kelas baru berhasil dikirim. Finance akan menerbitkan invoice.',
                'lead'       => new LeadResource($lead),
                'enrollment' => [
                    'id'             => $enrollment->id,
                    'study_class_id' => $enrollment->study_class_id,
                    'status'         => $enrollment->status,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => $e->getMessage(), 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('addEnrollment failed: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal membuat pengajuan kelas: ' . $e->getMessage()], 500);
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

    public function updateQualification(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'name'           => ['sometimes', 'string', 'max:255'],
            'nickname'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'province'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'city'           => ['sometimes', 'nullable', 'string', 'max:255'],
            'address'        => ['sometimes', 'nullable', 'string', 'max:1000'],
            'lead_type_id'   => ['nullable', 'exists:lead_types,id'],
            'lead_source_id' => ['nullable', 'exists:lead_sources,id'],
            'is_online'      => ['sometimes', 'boolean'],
        ]);

        $lead->update($validated);
        $this->clearDashboardCache();

        // Record Activity
        $leadType = $lead->leadType?->name ?: 'Belum ditentukan';
        $mode = $lead->is_online ? 'Online' : 'Offline / On Campus';
        $source = $lead->leadSource?->name ?: 'Belum ditentukan';
        
        activity()
            ->performedOn($lead)
            ->causedBy(auth()->user())
            ->log("Kualifikasi diperbarui: Nama: {$lead->name}, Program - {$leadType}, Mode - {$mode}, Sumber - {$source}");

        // Explicitly record to lead_activities for Reporting
        \App\Domains\CRM\Domain\Models\LeadActivity::create([
            'lead_id' => $lead->id,
            'user_id' => auth()->id(),
            'type' => 'message', // default activity type
            'description' => "Profil diperbarui: Nama: {$lead->name}, Panggilan: {$lead->nickname}, Alamat: {$lead->address}, {$lead->city}, {$lead->province}",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Qualification updated successfully.',
            'lead' => new LeadResource($lead->load([
                'branch', 'owner', 'leadSource', 'leadType', 'leadPhase', 
                'guardians', 'leadRelationships.relatedLead', 
                'ptSessions.ptExam',
                'consultations.consultant',
                'invoices.items',
                'student.studyClasses',
                'chatLogs.sender',
                'notes.user',
            ])),
        ]);
    }

    public function storeNote(Request $request, Lead $lead, \App\Domains\CRM\Application\Actions\Leads\StoreLeadNote $action): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'content' => 'required|string'
        ]);

        $action->handle($lead, $request->only('content'));

        return back()->with('success', 'Note added successfully.');
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

    public function storeConsultation(\App\Http\Requests\Crm\StoreConsultationRequest $request, Lead $lead, StoreLeadConsultation $action): JsonResponse
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
        $province = \App\Domains\Master\Domain\Models\Province::where('name', $provinceName)->first();
        if (!$province) return response()->json([]);

        $cities = \App\Domains\Master\Domain\Models\City::where('province_id', $province->id)
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

        // 1. Search Official Leads
        $leads = Lead::query()
            ->with('branch:id,name')
            ->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('lead_number', 'like', "%{$search}%");
            })
            ->latest()
            ->limit(5)
            ->get();

        // 2. Search Pending Registrations
        $registrations = \App\Domains\CRM\Domain\Models\LeadRegistration::query()
            ->with('branch:id,name')
            ->where('status', 'pending')
            ->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            })
            ->latest()
            ->limit(3)
            ->get();

        $results = collect($leads)->map(fn($l) => [
            'id' => $l->id,
            'type' => 'lead',
            'name' => $l->name,
            'phone' => $l->phone,
            'lead_number' => $l->lead_number,
            'branch_name' => $l->branch?->name,
        ])->concat(collect($registrations)->map(fn($r) => [
            'id' => $r->id,
            'type' => 'registration',
            'name' => "{$r->name} (Reg)",
            'phone' => $r->phone,
            'lead_number' => 'Pending Approval',
            'branch_name' => $r->branch?->name,
        ]));

        return response()->json($results);
    }

    public function kanban(Request $request): Response
    {
        $phases = LeadPhase::orderBy('created_at', 'asc')->get();
        $leadsQuery = Lead::with(['branch', 'owner', 'leadSource', 'leadType', 'leadPhase'])
            ->withCount('enrollments');

        if ($request->filled('branch_id')) {
            $leadsQuery->where('branch_id', $request->branch_id);
        }

        $startDate = $request->input('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', now()->endOfMonth()->format('Y-m-d'));

        if ($startDate && $endDate) {
            $leadsQuery->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                  ->orWhereBetween('enrolled_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            });
        }

        if ($request->filled('search')) {
            $leadsQuery->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
                  ->orWhere('lead_number', 'like', "%{$request->search}%");
            });
        }

        $leads = $leadsQuery->latest()->get();

        $kanbanData = $phases->map(function($phase) use ($leads, $startDate, $endDate) {
            $columnLeads = $leads->where('lead_phase_id', $phase->id);
            if ($phase->code === 'enrollment' && $startDate && $endDate) {
                $columnLeads = $columnLeads->filter(function($l) use ($startDate, $endDate) {
                    return $l->enrolled_at && 
                           $l->enrolled_at->format('Y-m-d') >= $startDate && 
                           $l->enrolled_at->format('Y-m-d') <= $endDate;
                });
            }

            return [
                'id' => $phase->id,
                'name' => $phase->name,
                'code' => $phase->code,
                'leads' => LeadResource::collection($columnLeads->values()),
            ];
        });

        return Inertia::render('Admin/Crm/Leads/Kanban', [
            'kanbanData' => $kanbanData,
            'filters' => [
                'branch_id' => $request->branch_id,
                'search' => $request->search,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'branches' => BranchResource::collection(Branch::select('id', 'name')->get()),
            'phases' => LeadPhaseResource::collection($phases),
            'sources' => LeadSourceResource::collection(LeadSource::select('id', 'name')->get()),
            'infoSources' => InfoSourceResource::collection(InfoSource::select('id', 'name')->get()),
            'types' => LeadTypeResource::collection(LeadType::select('id', 'name')->get()),
            'provinces' => Province::select('id', 'name')->orderBy('name')->get(),
            'chatTemplates' => ChatTemplate::with(['leadPhases', 'leadTypes'])->latest()->get(),
            'mediaAssets'   => MediaAsset::latest()->get(),
        ]);
    }

    private function clearDashboardCache(): void
    {
        $version = Cache::get('crm_dashboard_version', 1);
        Cache::put('crm_dashboard_version', $version + 1, now()->addYear());
    }
}



