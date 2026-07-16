<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Domains\Master\Domain\Models\Branch;
use App\Domains\CRM\Domain\Models\LeadRegistration;
use App\Domains\Master\Domain\Models\Province;
use App\Domains\Master\Domain\Models\City;
use App\Domains\Master\Domain\Models\LeadSource;
use App\Domains\Shared\Domain\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PublicLeadController extends Controller
{
    public function form()
    {
        $branches = Branch::orderBy('name')->get()->map(fn($b) => [
            'value' => $b->id,
            'label' => $b->name,
        ]);

        $provinces = Province::orderBy('name')->get()->map(fn($p) => [
            'value' => $p->name,
            'label' => $p->name,
        ]);
        
        $leadSources = LeadSource::orderBy('name')->get()->map(fn($s) => [
            'value' => $s->id,
            'label' => $s->name,
        ]);

        $infoSources = \App\Domains\Master\Domain\Models\InfoSource::orderBy('name')->get()->map(fn($s) => [
            'value' => $s->id,
            'label' => $s->name,
        ]);
        
        return Inertia::render('Public/Form', [
            'branch' => null,
            'branches' => $branches,
            'provinces' => $provinces,
            'leadSources' => $leadSources,
            'infoSources' => $infoSources,
        ]);
    }

    public function getCities(Request $request)
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
            ->get()
            ->map(fn($c) => [
                'value' => $c->name,
                'label' => $c->name,
            ]);

        return response()->json($cities);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nickname' => 'nullable|string|max:255',
            'phone' => ['required', 'string', 'max:20', 'regex:/^(\+?62|0)8[1-9][0-9]{7,11}$/'],
            'email' => 'nullable|email|max:255',
            'gender' => 'nullable|string|max:1',
            'birth_date' => 'nullable|date',
            'branch_id' => 'nullable|exists:branches,id',
            'school' => 'nullable|string|max:255',
            'grade' => 'nullable|string|max:50',
            'province' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'postal_code' => 'nullable|string|max:10',
            'guardian_data' => 'nullable|array',
            'lead_source_id' => 'nullable|exists:lead_sources,id',
            'info_source_id' => 'nullable|exists:info_sources,id',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'phone.required' => 'Nomor WhatsApp wajib diisi.',
            'phone.regex' => 'Format nomor WhatsApp tidak valid. Gunakan format seperti 081234567890 atau 6281234567890.',
        ]);

        $leadSourceId = $validated['lead_source_id'] ?? null;
        if (!$leadSourceId) {
            $webSource = \App\Domains\Master\Domain\Models\LeadSource::where('code', 'website')->first();
            $leadSourceId = $webSource?->id;
        }

        LeadRegistration::create([
            'id' => Str::uuid(),
            'name' => $validated['name'],
            'nickname' => $validated['nickname'] ?? null,
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'birth_date' => $validated['birth_date'] ?? null,
            'branch_id' => $validated['branch_id'] ?? null,
            'school' => $validated['school'] ?? null,
            'grade' => $validated['grade'] ?? null,
            'province' => $validated['province'] ?? null,
            'city' => $validated['city'] ?? null,
            'address' => $validated['address'] ?? null,
            'postal_code' => $validated['postal_code'] ?? null,
            'guardian_data' => $validated['guardian_data'] ?? [],
            'lead_source_id' => $leadSourceId,
            'info_source_id' => $validated['info_source_id'] ?? null,
            'status' => 'pending',
        ]);

        // Notify staff
        $superadmins = User::role('superadmin')->get();
        $branchFrontdesk = collect();
        if (!empty($validated['branch_id'])) {
            $branchFrontdesk = User::role('frontdesk')
                ->where('branch_id', $validated['branch_id'])
                ->get();
        }

        $recipients = $superadmins->merge($branchFrontdesk)->unique('id');

        Notification::send($recipients, new SystemNotification(
            "Pendaftaran Lead Baru",
            "Ada pendaftaran lead baru: {$validated['name']} melalui form publik.",
            "info",
            route('admin.crm.registrations.index')
        ));

        return redirect()->back()->with('success', 'Pendaftaran Anda telah kami terima. Tim kami akan segera menghubungi Anda!');
    }

    public function fillingForm($token)
    {
        $lead = \App\Domains\CRM\Domain\Models\Lead::where('self_registration_token', $token)->firstOrFail();
        
        $provinces = Province::orderBy('name')->get()->map(fn($p) => [
            'value' => $p->name,
            'label' => $p->name,
        ]);

        $leadSources = LeadSource::orderBy('name')->get()->map(fn($s) => [
            'value' => $s->id,
            'label' => $s->name,
        ]);

        $infoSources = \App\Domains\Master\Domain\Models\InfoSource::orderBy('name')->get()->map(fn($s) => [
            'value' => $s->id,
            'label' => $s->name,
        ]);

        return Inertia::render('Public/Form', [
            'branch' => $lead->branch,
            'provinces' => $provinces,
            'leadSources' => $leadSources,
            'infoSources' => $infoSources,
            'initialData' => [
                'name' => $lead->name,
                'nickname' => $lead->nickname,
                'phone' => $lead->phone,
                'email' => $lead->email,
                'gender' => $lead->gender,
                'birth_date' => $lead->birth_date ? $lead->birth_date->format('Y-m-d') : null,
                'branch_id' => $lead->branch_id,
                'school' => $lead->school,
                'grade' => $lead->grade,
                'province' => $lead->province,
                'city' => $lead->city,
                'address' => $lead->address,
                'postal_code' => $lead->postal_code,
                'lead_source_id' => $lead->lead_source_id,
                'info_source_id' => $lead->info_source_id,
                // Kita biarkan guardian_data kosong dulu untuk pengisian ulang bersih
                'guardian_data' => [
                    'father_name' => '',
                    'father_phone' => '',
                    'mother_name' => '',
                    'mother_phone' => '',
                ]
            ],
            'token' => $token
        ]);
    }

    public function submitFilling(Request $request, $token)
    {
        $lead = \App\Domains\CRM\Domain\Models\Lead::where('self_registration_token', $token)->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nickname' => 'nullable|string|max:255',
            'phone' => ['required', 'string', 'max:20', 'regex:/^(\+?62|0)8[1-9][0-9]{7,11}$/'],
            'email' => 'nullable|email|max:255',
            'gender' => 'nullable|string|max:1',
            'birth_date' => 'nullable|date',
            'school' => 'nullable|string|max:255',
            'grade' => 'nullable|string|max:50',
            'province' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'postal_code' => 'nullable|string|max:10',
            'guardian_data' => 'nullable|array',
            'lead_source_id' => 'nullable|exists:lead_sources,id',
            'info_source_id' => 'nullable|exists:info_sources,id',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'phone.required' => 'Nomor WhatsApp wajib diisi.',
            'phone.regex' => 'Format nomor WhatsApp tidak valid. Gunakan format seperti 081234567890 atau 6281234567890.',
        ]);

        if (empty($validated['lead_source_id'])) {
            $webSource = \App\Domains\Master\Domain\Models\LeadSource::where('code', 'website')->first();
            $validated['lead_source_id'] = $webSource?->id;
        }

        $lead->update([
            'pending_updates' => $validated
        ]);

        // Notify staff
        $superadmins = User::role('superadmin')->get();
        $branchFrontdesk = User::role('frontdesk')
            ->where('branch_id', $lead->branch_id)
            ->get();
        $owner = $lead->owner_id ? User::where('id', $lead->owner_id)->get() : collect();

        $recipients = $superadmins->merge($branchFrontdesk)->merge($owner)->unique('id');

        Notification::send($recipients, new SystemNotification(
            "Pembaruan Data Mandiri",
            "Lead {$lead->name} telah melakukan pengisian data mandiri.",
            "info",
            route('admin.crm.registrations.index') // Assuming this is where updates are approved
        ));

        return redirect()->back()->with('success', 'Data Anda telah lunas kami terima dan sedang dalam proses verifikasi admin. Terima kasih!');
    }

    /**
     * Publicly download an invoice via UUID.
     */
    public function downloadInvoice($id)
    {
        $invoice = \App\Domains\Finance\Domain\Models\Invoice::with(['items', 'lead', 'studyClass.branch'])->findOrFail($id);
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.invoice', compact('invoice'));
        
        return $pdf->stream("Invoice-{$invoice->invoice_number}.pdf");
    }
}


