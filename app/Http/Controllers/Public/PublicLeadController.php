<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Branch;
use App\Models\LeadRegistration;
use App\Models\Province;
use App\Models\City;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PublicLeadController extends Controller
{
    public function welcome($branchName)
    {
        $branch = Branch::where('name', 'like', "%$branchName%")->firstOrFail();
        
        return Inertia::render('Public/Welcome', [
            'branch' => $branch
        ]);
    }

    public function form($branchName)
    {
        $branch = Branch::where('name', 'like', "%$branchName%")->firstOrFail();
        $provinces = Province::orderBy('name')->get()->map(fn($p) => [
            'value' => $p->name,
            'label' => $p->name,
        ]);
        
        return Inertia::render('Public/Form', [
            'branch' => $branch,
            'provinces' => $provinces,
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
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'gender' => 'nullable|string|max:1',
            'birth_date' => 'nullable|date',
            'branch_id' => 'required|exists:branches,id',
            'school' => 'nullable|string|max:255',
            'grade' => 'nullable|string|max:50',
            'province' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'postal_code' => 'nullable|string|max:10',
            'guardian_data' => 'nullable|array',
        ]);

        LeadRegistration::create([
            'id' => Str::uuid(),
            'name' => $validated['name'],
            'nickname' => $validated['nickname'] ?? null,
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'birth_date' => $validated['birth_date'] ?? null,
            'branch_id' => $validated['branch_id'],
            'school' => $validated['school'] ?? null,
            'grade' => $validated['grade'] ?? null,
            'province' => $validated['province'] ?? null,
            'city' => $validated['city'] ?? null,
            'address' => $validated['address'] ?? null,
            'postal_code' => $validated['postal_code'] ?? null,
            'guardian_data' => $validated['guardian_data'] ?? [],
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Pendaftaran Anda telah kami terima. Tim kami akan segera menghubungi Anda!');
    }

    public function fillingForm($token)
    {
        $lead = \App\Models\Lead::where('self_registration_token', $token)->firstOrFail();
        
        $provinces = Province::orderBy('name')->get()->map(fn($p) => [
            'value' => $p->name,
            'label' => $p->name,
        ]);

        return Inertia::render('Public/Form', [
            'branch' => $lead->branch,
            'provinces' => $provinces,
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
        $lead = \App\Models\Lead::where('self_registration_token', $token)->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nickname' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
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
        ]);

        $lead->update([
            'pending_updates' => $validated
        ]);

        return redirect()->back()->with('success', 'Data Anda telah lunas kami terima dan sedang dalam proses verifikasi admin. Terima kasih!');
    }
}
