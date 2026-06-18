<?php

namespace App\Http\Controllers\Admin\Finance;

use App\Domains\Finance\Application\Actions\GenerateInvoice;
use App\Domains\Finance\Application\Actions\ProcessInvoicePayment;
use App\Domains\Finance\Application\Services\FinanceDashboardService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Finance\GenerateInvoiceRequest;
use App\Domains\Finance\Domain\Models\Invoice;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Domains\Academic\Domain\Models\StudyClass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    /**
     * Display the Finance Dashboard with leads ready for invoicing.
     */
    public function index(FinanceDashboardService $service): Response
    {
        return Inertia::render('Admin/Finance/Index', $service->getDashboardData());
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
            'branches' => \App\Http\Resources\Master\BranchResource::collection(\App\Domains\Master\Domain\Models\Branch::select('id', 'name')->get()),
            'phases' => \App\Http\Resources\Crm\LeadPhaseResource::collection(\App\Domains\Master\Domain\Models\LeadPhase::select('id', 'name', 'code')->get()),
            'sources' => \App\Http\Resources\Crm\LeadSourceResource::collection(\App\Domains\Master\Domain\Models\LeadSource::select('id', 'name')->get()),
            'types' => \App\Http\Resources\Crm\LeadTypeResource::collection(\App\Domains\Master\Domain\Models\LeadType::select('id', 'name')->get()),
            'provinces' => \App\Domains\Master\Domain\Models\Province::select('id', 'name')->orderBy('name')->get(),
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

    /**
     * Generate bulk renewal invoices for all active students in a study class.
     */
    public function bulkInvoice(StudyClass $studyClass, GenerateInvoice $action): RedirectResponse
    {
        $studyClass->load(['students.lead', 'priceMaster']);

        if (!$studyClass->price_master_id || !$studyClass->priceMaster) {
            return redirect()->back()->with('error', "Cannot generate bulk invoices: Class does not have a Price Master assigned.");
        }

        $activeStudents = $studyClass->students;

        if ($activeStudents->isEmpty()) {
            return redirect()->back()->with('error', "No active students found in this class cycle.");
        }

        $nextMeetingDate = $this->getNextMeetingDate($studyClass);
        $generatedCount = 0;
        $skippedCount = 0;

        foreach ($activeStudents as $student) {
            // Check if there is already a pending invoice for this student, class, and pending status
            $hasPending = Invoice::where('student_id', $student->id)
                ->where('study_class_id', $studyClass->id)
                ->where('status', 'pending')
                ->exists();

            if ($hasPending) {
                $skippedCount++;
                continue;
            }

            $action->handle([
                'student_id' => $student->id,
                'lead_id' => $student->lead_id,
                'study_class_id' => $studyClass->id,
                'price_master_id' => $studyClass->price_master_id,
                'join_date' => $nextMeetingDate,
                'billing_mode' => 'full',
                'notes' => "Automatic renewal invoice for {$studyClass->name} (Next cycle starting {$nextMeetingDate})",
            ]);

            $generatedCount++;
        }

        $message = "Renewal invoices process completed. Generated: {$generatedCount} invoice(s).";
        if ($skippedCount > 0) {
            $message .= " Skipped: {$skippedCount} student(s) due to existing pending invoices.";
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Get the next meeting date after the end session date of the class.
     */
    private function getNextMeetingDate(StudyClass $studyClass): string
    {
        $startDate = $studyClass->end_session_date ? $studyClass->end_session_date->copy() : now();
        $scheduleDays = $studyClass->schedule_days;

        if (empty($scheduleDays)) {
            return $startDate->addDay()->toDateString();
        }

        $current = $startDate->copy();
        // Loop up to 14 days to find the next class session day
        for ($i = 1; $i <= 14; $i++) {
            $current->addDay();
            if (in_array($current->format('l'), $scheduleDays)) {
                return $current->toDateString();
            }
        }

        return $startDate->addDay()->toDateString();
    }
}


