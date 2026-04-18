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
            'rejoinStudents' => \App\Models\Student::where('status', 'stop')
                ->orWhereHas('studyClasses', function($q) {
                    $q->whereBetween('end_session_date', [now()->toDateString(), now()->addDays(14)->toDateString()]);
                })
                ->with(['lead.branch', 'studyClasses' => fn($q) => $q->latest()->take(1)])
                ->latest()
                ->get(),
            'classes' => StudyClass::with(['branch', 'instructor', 'priceMaster'])->get(),
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
            'download_url' => route('public.invoice.download', $invoice->id)
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
     * Display a dedicated list of all invoices with search and filter capabilities.
     */
    public function invoices(Request $request): Response
    {
        $query = Invoice::with(['lead', 'student.lead', 'studyClass.branch'])->latest();

        // 1. Search by Invoice Number or Name
        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('lead', fn($l) => $l->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('student.lead', fn($l) => $l->where('name', 'like', "%{$search}%"));
            });
        }

        // 2. Filter by Date Range
        if ($request->start_date && $request->end_date) {
            $query->whereBetween('created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
        }

        // 3. Filter by Status
        if ($request->status) {
            $query->where('status', $request->status);
        }

        return Inertia::render('Admin/Finance/Invoices/Index', [
            'invoices' => $query->paginate(20)->withQueryString(),
            'filters' => $request->only(['search', 'start_date', 'end_date', 'status']),
        ]);
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
