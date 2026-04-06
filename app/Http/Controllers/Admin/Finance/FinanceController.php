<?php

namespace App\Http\Controllers\Admin\Finance;

use App\Actions\Finance\GenerateInvoice;
use App\Actions\Finance\ProcessInvoicePayment;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Finance\GenerateInvoiceRequest;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\PriceMaster;
use App\Models\StudyClass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    /**
     * Display the Finance Dashboard with leads ready for invoicing.
     */
    public function index(): Response
    {
        // Get leads in "Invoice" phase
        $leadsForInvoicing = Lead::where('lead_phase_id', '019d473d-26bc-7027-8ab0-5bed725bf6d4')
            ->whereDoesntHave('student') // Just in case, although promotion will change this
            ->with(['leadType', 'branch'])
            ->latest()
            ->get();

        return Inertia::render('Admin/Finance/Index', [
            'leads' => $leadsForInvoicing,
            'classes' => StudyClass::with(['branch', 'instructor'])->get(),
            'priceMasters' => PriceMaster::all(),
            'recentInvoices' => Invoice::with(['lead', 'student', 'studyClass'])->latest()->limit(10)->get(),
        ]);
    }

    /**
     * Generate an invoice for a lead after plotting them to a class.
     */
    public function generate(GenerateInvoiceRequest $request, GenerateInvoice $action): RedirectResponse
    {
        $invoice = $action->handle($request->validated());

        return redirect()->back()->with('success', "Invoice {$invoice->invoice_number} generated successfully.");
    }

    /**
     * Mark an invoice as paid and trigger student promotion/enrollment.
     */
    public function pay(Invoice $invoice, ProcessInvoicePayment $action): RedirectResponse
    {
        $action->handle($invoice);

        return redirect()->back()->with('success', "Invoice {$invoice->invoice_number} paid. Student promoted and enrolled.");
    }
}
