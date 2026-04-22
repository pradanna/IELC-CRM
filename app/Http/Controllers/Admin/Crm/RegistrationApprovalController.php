<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Actions\Crm\Leads\ApproveLeadRegistration;
use App\Actions\Crm\Leads\ApproveLeadUpdate;
use App\Http\Controllers\Controller;
use App\Http\Resources\Crm\LeadResource;
use App\Models\Lead;
use App\Models\LeadRegistration;
use App\Models\LeadSource;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationApprovalController extends Controller
{
    public function index(\Illuminate\Http\Request $request): Response
    {
        $search = $request->query('search');

        $registrations = LeadRegistration::where('status', 'pending')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->with(['branch', 'leadSource'])
            ->orderBy('created_at', 'desc')
            ->get();

        $updateRequests = Lead::whereNotNull('pending_updates')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('lead_number', 'like', "%{$search}%");
                });
            })
            ->with(['branch', 'leadSource', 'leadType', 'leadPhase'])
            ->get();

        $leadSources = LeadSource::orderBy('name')->get()->map(fn($s) => [
            'value' => $s->id,
            'label' => $s->name,
        ]);

        return Inertia::render('Admin/Crm/Registrations/Inbox', [
            'registrations' => $registrations, // Simple collection for now or create resource
            'update_requests' => LeadResource::collection($updateRequests),
            'lead_sources' => $leadSources,
            'pending_registrations_count' => $registrations->count() + $updateRequests->count(),
            'branches' => \App\Http\Resources\Master\BranchResource::collection(\App\Models\Branch::select('id', 'name')->get()),
            'phases' => \App\Http\Resources\Crm\LeadPhaseResource::collection(\App\Models\LeadPhase::select('id', 'name', 'code')->get()),
            'sources' => \App\Http\Resources\Crm\LeadSourceResource::collection(\App\Models\LeadSource::select('id', 'name')->get()),
            'types' => \App\Http\Resources\Crm\LeadTypeResource::collection(\App\Models\LeadType::select('id', 'name')->get()),
            'provinces' => \App\Models\Province::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function approveUpdate(Lead $lead, ApproveLeadUpdate $action): RedirectResponse
    {
        if (!$lead->pending_updates) {
            return redirect()->back()->with('error', 'Tidak ada pembaruan data untuk lead ini.');
        }

        $action->handle($lead);

        return redirect()->back()->with('success', "Profil Lead {$lead->name} berhasil diperbarui sesuai usulan mandiri.");
    }

    public function rejectUpdate(Lead $lead): RedirectResponse
    {
        $lead->update(['pending_updates' => null]);
        
        return redirect()->back()->with('success', "Usulan pembaruan profil {$lead->name} telah ditolak.");
    }

    public function approve(LeadRegistration $registration, ApproveLeadRegistration $action): RedirectResponse
    {
        $action->handle($registration);

        return redirect()->back()->with('success', "Lead {$registration->name} berhasil disetujui dan ditambahkan ke CRM!");
    }

    public function reject(LeadRegistration $registration): RedirectResponse
    {
        $registration->update(['status' => 'rejected']);
        
        return redirect()->back()->with('success', "Pendaftaran {$registration->name} telah ditolak.");
    }
}

