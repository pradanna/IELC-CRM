<?php

namespace App\Http\Controllers\Admin\CRM;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\LeadRegistration;
use App\Models\LeadSource;
use App\Models\LeadPhase;
use App\Actions\Admin\CRM\StoreLead;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RegistrationApprovalController extends Controller
{
    public function index()
    {
        $registrations = LeadRegistration::where('status', 'pending')
            ->with('branch')
            ->orderBy('created_at', 'desc')
            ->get();

        $updateRequests = \App\Models\Lead::whereNotNull('pending_updates')
            ->with('branch')
            ->get();

        return Inertia::render('Admin/CRM/Registrations/Inbox', [
            'registrations' => $registrations,
            'update_requests' => $updateRequests,
            'pending_registrations_count' => $registrations->count() + $updateRequests->count(),
        ]);
    }

    public function approveUpdate(\App\Models\Lead $lead)
    {
        if (!$lead->pending_updates) {
            return redirect()->back()->with('error', 'Tidak ada pembaruan data untuk lead ini.');
        }

        $updates = $lead->pending_updates;

        // Merge updates carefully
        $lead->update([
            'name' => $updates['name'] ?? $lead->name,
            'nickname' => $updates['nickname'] ?? $lead->nickname,
            'phone' => $updates['phone'] ?? $lead->phone,
            'email' => $updates['email'] ?? $lead->email,
            'gender' => $updates['gender'] ?? $lead->gender,
            'birth_date' => $updates['birth_date'] ?? $lead->birth_date,
            'school' => $updates['school'] ?? $lead->school,
            'grade' => $updates['grade'] ?? $lead->grade,
            'province' => $updates['province'] ?? $lead->province,
            'city' => $updates['city'] ?? $lead->city,
            'address' => $updates['address'] ?? $lead->address,
            'postal_code' => $updates['postal_code'] ?? $lead->postal_code,
            'pending_updates' => null, // Clear after approval
        ]);

        return redirect()->back()->with('success', "Profil Lead {$lead->name} berhasil diperbarui sesuai usulan mandiri.");
    }

    public function rejectUpdate(\App\Models\Lead $lead)
    {
        $lead->update(['pending_updates' => null]);
        
        return redirect()->back()->with('success', "Usulan pembaruan profil {$lead->name} telah ditolak.");
    }

    public function approve(LeadRegistration $registration, StoreLead $storeLead)
    {
        return DB::transaction(function () use ($registration, $storeLead) {
            // 1. Get or Create "Self-Registration" Source
            $source = LeadSource::firstOrCreate(
                ['name' => 'Self-Registration'],
                ['id' => \Illuminate\Support\Str::uuid()]
            );

            // 2. Prepare Data for StoreLead Action
            $guardians = [];
            if ($registration->guardian_data && !empty($registration->guardian_data)) {
                if (!empty($registration->guardian_data['father_name'])) {
                    $guardians[] = [
                        'role' => 'ayah',
                        'name' => $registration->guardian_data['father_name'],
                        'phone' => $registration->guardian_data['father_phone'] ?? '',
                        'is_main_contact' => true
                    ];
                }
                if (!empty($registration->guardian_data['mother_name'])) {
                    $guardians[] = [
                        'role' => 'ibu',
                        'name' => $registration->guardian_data['mother_name'],
                        'phone' => $registration->guardian_data['mother_phone'] ?? '',
                        'is_main_contact' => empty($guardians) // If no father, mother is main
                    ];
                }
            }

            $leadData = [
                'name' => $registration->name,
                'nickname' => $registration->nickname,
                'phone' => $registration->phone,
                'email' => $registration->email,
                'gender' => $registration->gender,
                'birth_date' => $registration->birth_date,
                'school' => $registration->school,
                'grade' => $registration->grade,
                'branch_id' => $registration->branch_id,
                'lead_source_id' => $source->id,
                'province' => $registration->province,
                'city' => $registration->city,
                'address' => $registration->address,
                'postal_code' => $registration->postal_code,
                'is_online' => true,
                'guardians' => $guardians,
            ];

            // 3. Promote to Official Lead
            $lead = $storeLead->handle($leadData);

            // 4. Update Registration Status
            $registration->update(['status' => 'approved']);

            return redirect()->back()->with('success', "Lead {$lead->name} berhasil disetujui dan ditambahkan ke CRM!");
        });
    }

    public function reject(LeadRegistration $registration)
    {
        $registration->update(['status' => 'rejected']);
        
        return redirect()->back()->with('success', "Pendaftaran {$registration->name} telah ditolak.");
    }
}
