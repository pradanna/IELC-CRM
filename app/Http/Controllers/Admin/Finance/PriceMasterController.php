<?php

namespace App\Http\Controllers\Admin\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Finance\StorePriceMasterRequest;
use App\Http\Requests\Admin\Finance\UpdatePriceMasterRequest;
use App\Domains\Finance\Domain\Models\PriceMaster;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PriceMasterController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Finance/PriceMaster/Index', [
            'priceMasters' => PriceMaster::latest()->get(),
            'initialFeeSettings' => [
                'registration_fee' => (int) \App\Domains\Finance\Domain\Models\FinanceSetting::get('registration_fee', 25000),
                'placement_test_fee' => (int) \App\Domains\Finance\Domain\Models\FinanceSetting::get('placement_test_fee', 100000),
            ],
        ]);
    }

    public function updateInitialFees(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'registration_fee' => 'required|numeric|min:0',
            'placement_test_fee' => 'required|numeric|min:0',
        ]);

        \App\Domains\Finance\Domain\Models\FinanceSetting::set('registration_fee', $validated['registration_fee'], 'Default Registration Fee');
        \App\Domains\Finance\Domain\Models\FinanceSetting::set('placement_test_fee', $validated['placement_test_fee'], 'Default Placement Test Fee');

        return redirect()->back()->with('success', 'Harga Initial Placement Test & Registrasi berhasil diperbarui.');
    }

    public function store(StorePriceMasterRequest $request): RedirectResponse
    {
        PriceMaster::create($request->validated());

        return redirect()->back()->with('success', 'Price master created successfully.');
    }

    public function update(UpdatePriceMasterRequest $request, PriceMaster $priceMaster): RedirectResponse
    {
        $priceMaster->update($request->validated());

        return redirect()->back()->with('success', 'Price master updated successfully.');
    }

    public function destroy(PriceMaster $priceMaster): RedirectResponse
    {
        $priceMaster->delete();

        return redirect()->back()->with('success', 'Price master deleted successfully.');
    }
}


