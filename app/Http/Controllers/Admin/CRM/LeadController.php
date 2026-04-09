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
use App\Http\Resources\CRM\LeadActivityResource;
use App\Http\Resources\Crm\PtExam\PtExamResource;
use App\Models\PtExam;
use App\Models\LeadConsultation;
use App\Http\Requests\CRM\StoreConsultationRequest;
use App\Models\StudyClass;
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

        // Special handling for monthly filtering:
        // By default, we filter by created_at.
        // However, if specifically looking at the Enrollment phase, we use enrolled_at.
        $targetMonth = $request->input('month');
        $targetYear  = $request->input('year');
        $enrollmentPhase = \App\Models\LeadPhase::where('code', 'enrollment')->first();

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

        return Inertia::render('Admin/CRM/ListView', [
            'leads' => LeadResource::collection($leads),
            'filters' => $request->only(['branch_id', 'lead_phase_id', 'month', 'year', 'search']),
            'branches' => Branch::select('id', 'name')->get(),
            'phases' => \App\Models\LeadPhase::select('id', 'name', 'code')->get(),
            'sources' => LeadSource::select('id', 'name')->get(),
            'types' => LeadType::select('id', 'name')->get(),
            'provinces' => Province::select('id', 'name')->orderBy('name')->get(),
            'chatTemplates' => \App\Models\ChatTemplate::with(['leadPhases', 'leadTypes'])->latest()->get(),
            'mediaAssets'   => \App\Models\MediaAsset::latest()->get(),
            'pending_registrations_count' => \App\Models\LeadRegistration::where('status', 'pending')->count(),
        ]);
    }

    public function show(Lead $lead): JsonResponse
    {
        try {
            // Load available classes for this specific branch
            $availableClasses = StudyClass::where('branch_id', $lead->branch_id)
                ->with('instructor:id,name')
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
                'availableExams' => PtExamResource::collection(PtExam::where('is_active', true)->get()),
                'availableClasses' => $availableClasses,
                'chatTemplates'  => \App\Models\ChatTemplate::with(['leadPhases', 'leadTypes'])->get()
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error in LeadController@show: " . $e->getMessage());
            return response()->json(['error' => 'Failed to load lead details: ' . $e->getMessage()], 500);
        }
    }

    public function plotClass(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'study_class_id' => 'required|exists:study_classes,id',
            'join_date' => 'required|date',
            'notes' => 'nullable|string',
            'estimated_cost' => 'nullable|numeric',
        ]);

        $studyClass = StudyClass::findOrFail($validated['study_class_id']);
        
        // Calculate pro-rata meetings (simple estimation based on start date vs join date)
        // If join date is after start date, count remaining meetings on schedule days.
        $remaining = 0;
        if ($studyClass->start_session_date && is_array($studyClass->schedule_days)) {
            $joinDate = \Carbon\Carbon::parse($validated['join_date']);
            $endDate = $studyClass->end_session_date;
            
            if ($endDate && $joinDate->lessThanOrEqualTo($endDate)) {
                $period = \Carbon\CarbonPeriod::create($joinDate, $endDate);
                foreach ($period as $date) {
                    if (in_array($date->format('l'), $studyClass->schedule_days)) {
                        $remaining++;
                    }
                }
            }
        }

        $lead->update([
            'plotting' => array_merge($validated, [
                'remaining_meetings' => $remaining,
                'total_meetings' => $studyClass->total_meetings,
            ])
        ]);

        activity()
            ->performedOn($lead)
            ->causedBy(auth()->user())
            ->log("Leads plotted to class: " . $studyClass->name);

        return response()->json([
            'message' => 'Lead plotting updated.',
            'lead' => new LeadResource($lead->refresh())
        ]);
    }

    public function sendTemplate(Request $request, Lead $lead): JsonResponse
    {
        $request->validate([
            'chat_template_id' => 'required|exists:chat_templates,id',
        ]);

        $template = \App\Models\ChatTemplate::findOrFail($request->chat_template_id);
        
        // Render message with variables
        $message = str_replace(
            ['{{name}}', '{{nickname}}', '{{lead_number}}', '{{admin_name}}'],
            [
                $lead->name ?: 'Kak', 
                $lead->nickname ?: ($lead->name ?: 'Kak'), 
                $lead->lead_number, 
                auth()->user()->name
            ],
            $template->message
        );

        // Ensure branch is loaded for correct branch code
        $lead->load('branch');
        $branchCode = $lead->branch?->code ?: 'solo';
        
        // Sanitize phone (numbers only)
        $phone = preg_replace('/[^0-9]/', '', $lead->phone);

        $whatsappService = app(\App\Services\WhatsAppService::class);
        
        try {
            $result = $whatsappService->sendMessage($branchCode, $phone, $message);

            if (!($result['success'] ?? false)) {
                $errorMsg = $result['message'] ?? $result['error'] ?? 'Unknown Gateway Error';
                \Illuminate\Support\Facades\Log::warning("WA Template Send Failed for Lead {$lead->id}: " . $errorMsg);
                return response()->json(['error' => 'WhatsApp Gateway Error: ' . $errorMsg], 500);
            }

            // Log it in Database
            \App\Models\LeadChatLog::create([
                'lead_id'          => $lead->id,
                'chat_template_id' => $template->id,
                'lead_phase_id'    => $lead->lead_phase_id,
                'user_id'          => auth()->id(),
                'message'          => $message,
            ]);

            return response()->json(['message' => 'Template sent effectively.']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send WhatsApp Template for Lead {$lead->id}: " . $e->getMessage());
            return response()->json(['error' => 'Failed to send WhatsApp: ' . $e->getMessage()], 500);
        }
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
            'activities' => LeadActivityResource::collection($activities),
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

        $lead->load([
            'branch', 'owner', 'creator', 'leadSource', 'leadType', 'leadPhase', 
            'guardians', 'leadRelationships.relatedLead', 
            'ptSessions.ptExam',
            'consultations.consultant',
            'invoices.items',
            'student.studyClasses',
            'chatLogs.sender',
        ]);

        $this->clearDashboardCache($lead);

        return response()->json([
            'message' => 'Lead phase updated successfully.',
            'lead' => new LeadResource($lead),
        ]);
    }

    public function recordFollowUp(Request $request, Lead $lead): JsonResponse
    {
        $now = now();
        
        // Hanya nambah follow_up_count MAKSIMAL 1x per hari
        if (!$lead->last_activity_at || !$lead->last_activity_at->isToday()) {
            $lead->increment('follow_up_count');
        }

        $lead->update(['last_activity_at' => $now]);

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
            ->causedBy(auth()->user() ?? null)
            ->log($message);

        $this->clearDashboardCache($lead);

        return response()->json([
            'message' => 'Follow-up recorded successfully.',
            'lead' => new LeadResource($lead->load(['leadPhase', 'chatLogs.sender'])),
        ]);
    }

    public function resetFollowUp(Lead $lead): JsonResponse
    {
        if ($lead->follow_up_count > 0) {
            $lead->update([
                'follow_up_count' => 0,
                'last_activity_at' => now(), // Merespon dianggap aktivitas terbaru
            ]);
            
            activity()
                ->performedOn($lead)
                ->log("Follow-up counter reset to 0 (Lead responded)");

            $this->clearDashboardCache($lead);
        }

        return response()->json([
            'message' => 'Follow-up reset successfully.',
            'lead' => new LeadResource($lead->load(['leadPhase', 'chatLogs.sender'])),
        ]);
    }

    public function storeConsultation(StoreConsultationRequest $request, Lead $lead): JsonResponse
    {
        $consultation = $lead->consultations()->create([
            'user_id'           => auth()->id(),
            'consultation_date' => $request->consultation_date,
            'notes'             => $request->notes,
            'recommended_level' => $request->recommended_level,
            'follow_up_note'    => $request->follow_up_note,
        ]);

        // Record activity log
        activity()
            ->performedOn($lead)
            ->causedBy(auth()->user())
            ->log("Consultation recorded. Recommended Level: " . ($request->recommended_level ?? 'None'));

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

        // Unified Filter:
        // Include leads CREATED in this month OR leads ENROLLED in this month (regardless of creation)
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

        // Group leads by phase for the Kanban Board
        $kanbanData = $phases->map(function($phase) use ($leads, $month, $year) {
            $columnLeads = $leads->where('lead_phase_id', $phase->id);

            // Special logic for Enrollment column:
            // Only show leads that actually ENROLLED in this specific period.
            // This ensures consistency with Dashboard KPIs and Trend Charts.
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
            'pending_registrations_count' => \App\Models\LeadRegistration::where('status', 'pending')->count(),
        ]);
    }

    public function approveUpdates(Lead $lead): JsonResponse
    {
        if (!$lead->pending_updates) {
            return response()->json(['message' => 'No pending updates found.'], 422);
        }

        $lead->update(array_merge($lead->pending_updates, [
            'pending_updates' => null,
            'last_activity_at' => now(),
        ]));

        $lead->load([
            'branch', 'owner', 'creator', 'leadSource', 'leadType', 'leadPhase', 
            'guardians', 'leadRelationships.relatedLead', 'ptSessions.ptExam',
            'consultations.consultant', 'invoices.items', 'student.studyClasses', 'chatLogs.sender'
        ]);

        return response()->json([
            'message' => 'Lead profile updates approved and applied.',
            'lead' => new \App\Http\Resources\Admin\CRM\LeadResource($lead)
        ]);
    }

    public function rejectUpdates(Lead $lead): JsonResponse
    {
        $lead->update(['pending_updates' => null]);

        return response()->json([
            'message' => 'Pending updates rejected and cleared.',
            'lead' => new \App\Http\Resources\Admin\CRM\LeadResource($lead)
        ]);
    }

    private function clearDashboardCache(Lead $lead): void
    {
        $version = \Illuminate\Support\Facades\Cache::get('crm_dashboard_version', 1);
        \Illuminate\Support\Facades\Cache::put('crm_dashboard_version', $version + 1, now()->addYear());
    }
}
