<?php

namespace App\Http\Controllers\Admin\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreMonthlyTargetRequest;
use App\Http\Requests\Master\StoreLeadPhaseRequest;
use App\Http\Requests\Master\StoreLeadSourceRequest;
use App\Http\Requests\Master\StoreLeadTypeRequest;
use App\Http\Requests\Master\UpdateMonthlyTargetRequest;
use App\Http\Requests\Master\UpdateLeadPhaseRequest;
use App\Http\Requests\Master\UpdateLeadSourceRequest;
use App\Http\Requests\Master\UpdateLeadTypeRequest;
use App\Models\Branch;
use App\Models\LeadPhase;
use App\Models\LeadSource;
use App\Models\LeadType;
use App\Models\MonthlyTarget;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MasterDataController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Master/MasterData', [
            'leadTypes'      => LeadType::orderBy('name')->get(),
            'leadPhases'     => LeadPhase::orderBy('name')->get(),
            'leadSources'    => LeadSource::orderBy('name')->get(),
            'monthlyTargets' => MonthlyTarget::with('branch')->latest()->get(),
            'branches'       => Branch::select('id', 'name')->get(),
            'chatTemplates'  => \App\Models\ChatTemplate::with(['leadPhases', 'leadTypes'])->latest()->get(),
            'mediaAssets'    => \App\Models\MediaAsset::latest()->get(),
        ]);
    }

    // ─── Lead Types ────────────────────────────────────────────────────────────

    public function storeLeadType(StoreLeadTypeRequest $request): RedirectResponse
    {
        LeadType::create($request->validated());

        return redirect()->back()->with('success', 'Lead type berhasil ditambahkan.');
    }

    public function updateLeadType(UpdateLeadTypeRequest $request, LeadType $leadType): RedirectResponse
    {
        $leadType->update($request->validated());

        return redirect()->back()->with('success', 'Lead type berhasil diperbarui.');
    }

    public function destroyLeadType(LeadType $leadType): RedirectResponse
    {
        $leadType->delete();

        return redirect()->back()->with('success', 'Lead type berhasil dihapus.');
    }

    // ─── Lead Phases ───────────────────────────────────────────────────────────

    public function storeLeadPhase(StoreLeadPhaseRequest $request): RedirectResponse
    {
        LeadPhase::create($request->validated());

        return redirect()->back()->with('success', 'Lead phase berhasil ditambahkan.');
    }

    public function updateLeadPhase(UpdateLeadPhaseRequest $request, LeadPhase $leadPhase): RedirectResponse
    {
        $leadPhase->update($request->validated());

        return redirect()->back()->with('success', 'Lead phase berhasil diperbarui.');
    }

    public function destroyLeadPhase(LeadPhase $leadPhase): RedirectResponse
    {
        $leadPhase->delete();

        return redirect()->back()->with('success', 'Lead phase berhasil dihapus.');
    }

    // ─── Lead Sources ──────────────────────────────────────────────────────────

    public function storeLeadSource(StoreLeadSourceRequest $request): RedirectResponse
    {
        LeadSource::create($request->validated());

        return redirect()->back()->with('success', 'Lead source berhasil ditambahkan.');
    }

    public function updateLeadSource(UpdateLeadSourceRequest $request, LeadSource $leadSource): RedirectResponse
    {
        $leadSource->update($request->validated());

        return redirect()->back()->with('success', 'Lead source berhasil diperbarui.');
    }

    public function destroyLeadSource(LeadSource $leadSource): RedirectResponse
    {
        $leadSource->delete();

        return redirect()->back()->with('success', 'Lead source berhasil dihapus.');
    }

    // ─── Monthly Targets ───────────────────────────────────────────────────────

    public function storeMonthlyTarget(StoreMonthlyTargetRequest $request): RedirectResponse
    {
        MonthlyTarget::create($request->validated());

        return redirect()->back()->with('success', 'Monthly target berhasil ditambahkan.');
    }

    public function updateMonthlyTarget(UpdateMonthlyTargetRequest $request, MonthlyTarget $monthlyTarget): RedirectResponse
    {
        $monthlyTarget->update($request->validated());

        return redirect()->back()->with('success', 'Monthly target berhasil diperbarui.');
    }

    public function destroyMonthlyTarget(MonthlyTarget $monthlyTarget): RedirectResponse
    {
        $monthlyTarget->delete();

        return redirect()->back()->with('success', 'Monthly target berhasil dihapus.');
    }
}
