<?php

namespace App\Http\Controllers\Admin\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Finance\StorePriceMasterRequest;
use App\Http\Requests\Admin\Finance\UpdatePriceMasterRequest;
use App\Models\PriceMaster;
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
        ]);
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
