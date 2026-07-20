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
        $query = Invoice::with(['lead', 'student.lead', 'studyClass.branch', 'items'])->latest();

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

        // 4. Filter by Type: new_join (no student_id) or rejoin (has student_id)
        if ($request->type === 'new_join') {
            $query->whereNull('student_id');
        } elseif ($request->type === 'rejoin') {
            $query->whereNotNull('student_id');
        }

        return Inertia::render('Admin/Finance/Invoices/Index', [
            'invoices' => $query->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'start_date', 'end_date', 'status', 'type']),
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
            // Check if there is already a paid invoice for this student and class (do not touch paid ones)
            $hasPaidInvoice = Invoice::where('student_id', $student->id)
                ->where('study_class_id', $studyClass->id)
                ->where('status', 'paid')
                ->exists();

            if ($hasPaidInvoice) {
                $skippedCount++;
                continue;
            }

            // Delete any existing pending invoice so we can regenerate it with the new price
            Invoice::where('student_id', $student->id)
                ->where('study_class_id', $studyClass->id)
                ->where('status', 'pending')
                ->forceDelete();

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
            $message .= " Skipped: {$skippedCount} student(s) due to existing paid invoices.";
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

    /**
     * Display financial reports and charts.
     */
    public function reports(): Response
    {
        $paidInvoicesQuery = Invoice::where('status', 'paid');
        $pendingInvoicesQuery = Invoice::where('status', 'pending');

        $totalRevenue = (int) $paidInvoicesQuery->sum('total_amount');
        $totalPending = (int) $pendingInvoicesQuery->sum('total_amount');
        $totalDiscount = (int) $paidInvoicesQuery->sum('discount_amount');
        $paidCount = $paidInvoicesQuery->count();
        $averageOrderValue = $paidCount > 0 ? (int) round($totalRevenue / $paidCount) : 0;

        // Revenue by Student Type (New Join vs. Rejoin)
        $newJoinRevenue = (int) Invoice::where('status', 'paid')->whereNull('student_id')->sum('total_amount');
        $rejoinRevenue = (int) Invoice::where('status', 'paid')->whereNotNull('student_id')->sum('total_amount');

        // Revenue by Class
        $classRevenue = Invoice::where('status', 'paid')
            ->whereNotNull('study_class_id')
            ->with('studyClass')
            ->get()
            ->groupBy('study_class_id')
            ->map(function ($group) {
                return [
                    'class_name' => $group->first()->studyClass->name,
                    'total' => (int) $group->sum('total_amount'),
                    'count' => $group->count(),
                ];
            })
            ->values()
            ->sortByDesc('total')
            ->take(5)
            ->values();

        // Monthly Trend (Last 6 Months)
        $monthlyTrend = collect();
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            $monthLabel = $monthStart->translatedFormat('F Y');

            $monthlySum = (int) Invoice::where('status', 'paid')
                ->whereBetween('paid_at', [$monthStart, $monthEnd])
                ->sum('total_amount');

            $monthlyTrend->push([
                'month' => $monthLabel,
                'total' => $monthlySum,
            ]);
        }

        return Inertia::render('Admin/Finance/Reports/Index', [
            'stats' => [
                'total_revenue' => $totalRevenue,
                'total_pending' => $totalPending,
                'total_discount' => $totalDiscount,
                'average_order_value' => $averageOrderValue,
                'new_join_revenue' => $newJoinRevenue,
                'rejoin_revenue' => $rejoinRevenue,
                'class_revenue' => $classRevenue,
                'monthly_trend' => $monthlyTrend,
            ]
        ]);
    }
}


