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
        $invoicePhase = \App\Models\LeadPhase::where('code', 'invoice')->first();
        $invoicePhaseId = $invoicePhase?->id ?? 'non-existent-id';

        $leadsForInvoicing = Lead::where('lead_phase_id', $invoicePhaseId)
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

        return redirect()->back()->with([
            'success' => "Invoice {$invoice->invoice_number} generated successfully.",
            'new_invoice_id' => $invoice->id,
            'download_url' => route('admin.finance.invoices.download', $invoice->id)
        ]);
    }

    /**
     * Mark an invoice as paid and trigger student promotion/enrollment.
     */
    public function pay(Invoice $invoice, ProcessInvoicePayment $action): RedirectResponse
    {
        $action->handle($invoice);

        return redirect()->back()->with('success', "Invoice {$invoice->invoice_number} paid. Student promoted and enrolled.");
    }

    /**
     * Generate and download the PDF for a specific invoice.
     */
    public function download(Invoice $invoice)
    {
        $invoice->load(['items', 'lead', 'studyClass.branch']);
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.invoice', compact('invoice'));
        
        return $pdf->stream("Invoice-{$invoice->invoice_number}.pdf");
    }
}
