<?php

namespace App\Http\Controllers\Admin\CRM;

use App\Actions\CRM\Leads\ApproveLeadRegistration;
use App\Actions\CRM\Leads\ApproveLeadUpdate;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadRegistration;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationApprovalController extends Controller
{
    public function index(): Response
    {
        $registrations = LeadRegistration::where('status', 'pending')
            ->with(['branch', 'leadSource', 'leadType'])
            ->orderBy('created_at', 'desc')
            ->get();

        $updateRequests = Lead::whereNotNull('pending_updates')
            ->with(['branch', 'leadSource', 'leadType', 'leadPhase'])
            ->get();

        return Inertia::render('Admin/CRM/Registrations/Inbox', [
            'registrations' => $registrations, // Simple collection for now or create resource
            'update_requests' => LeadResource::collection($updateRequests),
            'pending_registrations_count' => $registrations->count() + $updateRequests->count(),
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
