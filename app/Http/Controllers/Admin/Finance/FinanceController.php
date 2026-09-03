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
use App\Domains\Master\Domain\Models\LeadType;
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
    public function pay(Request $request, Invoice $invoice, ProcessInvoicePayment $action): RedirectResponse
    {
        $validated = $request->validate([
            'payment_method' => ['nullable', 'string', 'max:255'],
        ]);

        $action->handle($invoice, $validated['payment_method'] ?? null);

        return redirect()->back()->with('success', "Invoice {$invoice->invoice_number} paid. Student promoted and enrolled.");
    }

    /**
     * Cancel a pending invoice.
     */
    public function cancel(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== 'pending') {
            return redirect()->back()->with('error', "Hanya invoice berstatus pending yang bisa dibatalkan.");
        }

        $invoice->update(['status' => 'cancelled']);

        return redirect()->back()->with('success', "Invoice {$invoice->invoice_number} berhasil dibatalkan.");
    }

    /**
     * Display a dedicated list of all invoices with search and filter capabilities.
     */
    public function invoices(Request $request): Response
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

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
        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        }

        // 3. Filter by Status
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // 4. Filter by Type: new_join, rejoin, paket_lanjut, placement_test
        if ($request->type === 'new_join') {
            $query->where('type', 'new_join');
        } elseif ($request->type === 'rejoin') {
            $query->where('type', 'rejoin');
        } elseif ($request->type === 'paket_lanjut') {
            $query->where('type', 'paket_lanjut');
        } elseif ($request->type === 'placement_test') {
            $query->where('type', 'placement_test');
        }

        // Summary calculations (on filtered base query including status filter so cards reflect all filters)
        $baseQuery = Invoice::query();
        if ($startDate && $endDate) {
            $baseQuery->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        }
        if ($request->search) {
            $search = $request->search;
            $baseQuery->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('lead', fn($l) => $l->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('student.lead', fn($l) => $l->where('name', 'like', "%{$search}%"));
            });
        }
        if ($request->type) {
            $baseQuery->where('type', $request->type);
        }
        if ($request->status) {
            $baseQuery->where('status', $request->status);
        }

        $summary = [
            'total_count' => (clone $baseQuery)->count(),
            'paid_count' => (clone $baseQuery)->where('status', 'paid')->count(),
            'paid_amount' => (clone $baseQuery)->where('status', 'paid')->sum('total_amount'),
            'pending_count' => (clone $baseQuery)->where('status', 'pending')->count(),
            'pending_amount' => (clone $baseQuery)->where('status', 'pending')->sum('total_amount'),
            'cancelled_count' => (clone $baseQuery)->where('status', 'cancelled')->count(),
            'cancelled_amount' => (clone $baseQuery)->where('status', 'cancelled')->sum('total_amount'),
        ];

        return Inertia::render('Admin/Finance/Invoices/Index', [
            'invoices' => $query->paginate(10)->withQueryString(),
            'filters' => [
                'search' => $request->search ?? '',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $request->status ?? '',
                'type' => $request->type ?? '',
            ],
            'summary' => $summary,
            'branches' => \App\Http\Resources\Master\BranchResource::collection(\App\Domains\Master\Domain\Models\Branch::select('id', 'name')->get()),
            'phases' => \App\Http\Resources\Crm\LeadPhaseResource::collection(\App\Domains\Master\Domain\Models\LeadPhase::select('id', 'name', 'code')->get()),
            'sources' => \App\Http\Resources\Crm\LeadSourceResource::collection(\App\Domains\Master\Domain\Models\LeadSource::select('id', 'name')->get()),
            'types' => \App\Http\Resources\Crm\LeadTypeResource::collection(\App\Domains\Master\Domain\Models\LeadType::select('id', 'name')->get()),
            'provinces' => \App\Domains\Master\Domain\Models\Province::select('id', 'name')->orderBy('name')->get(),
            'classes' => \App\Http\Resources\Academic\StudyClassResource::collection(StudyClass::with(['branch', 'instructor', 'priceMaster'])->get()),
            'priceMasters' => PriceMaster::all(),
            'loyaltySettings' => \App\Domains\Finance\Domain\Models\LoyaltySetting::all(),
            'siblingSettings' => [
                'use_sibling_discount' => filter_var(\App\Domains\Finance\Domain\Models\FinanceSetting::get('use_sibling_discount', '0'), FILTER_VALIDATE_BOOLEAN),
                'sibling_discount_percent' => (int) \App\Domains\Finance\Domain\Models\FinanceSetting::get('sibling_discount_percent', '0'),
            ],
            'initialFeeSettings' => [
                'registration_fee' => (int) \App\Domains\Finance\Domain\Models\FinanceSetting::get('registration_fee', 25000),
                'placement_test_fee' => (int) \App\Domains\Finance\Domain\Models\FinanceSetting::get('placement_test_fee', 100000),
            ],
            'paymentAccounts' => \App\Domains\Finance\Domain\Models\PaymentAccount::where('is_active', true)->orderBy('type')->orderBy('name')->get(),
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
    public function reports(Request $request): Response
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());
        $branchId = $request->input('branch_id');
        $typeFilter = $request->input('type');
        $studyClassIdFilter = $request->input('study_class_id');
        $priceMasterIdFilter = $request->input('price_master_id');
        $leadTypeIdFilter = $request->input('lead_type_id');
        $dailyDate = $request->input('daily_date', now()->toDateString());
        $search = $request->input('search');

        // Helper to apply filters to invoice queries
        $applyFilters = function($query) use ($branchId, $typeFilter, $studyClassIdFilter, $priceMasterIdFilter, $leadTypeIdFilter) {
            if ($branchId) {
                $query->whereHas('studyClass', fn($q) => $q->where('branch_id', $branchId));
            }

            if ($typeFilter) {
                if ($typeFilter === 'new_join') {
                    $query->where(fn($q) => $q->where('type', 'new_join')->orWhere(fn($sq) => $sq->whereNull('type')->whereNull('student_id')));
                } elseif ($typeFilter === 'rejoin') {
                    $query->where(fn($q) => $q->where('type', 'rejoin')->orWhere(fn($sq) => $sq->whereNull('type')->whereNotNull('student_id')));
                } elseif ($typeFilter === 'placement_test') {
                    $query->where('type', 'placement_test');
                } else {
                    $query->where('type', $typeFilter);
                }
            }

            if ($studyClassIdFilter) {
                $query->where('study_class_id', $studyClassIdFilter);
            }

            if ($priceMasterIdFilter) {
                $query->where(function($q) use ($priceMasterIdFilter) {
                    $q->whereHas('items', fn($iq) => $iq->where('price_master_id', $priceMasterIdFilter))
                      ->orWhereHas('studyClass', fn($sq) => $sq->where('price_master_id', $priceMasterIdFilter));
                });
            }

            if ($leadTypeIdFilter) {
                $query->where(function($q) use ($leadTypeIdFilter) {
                    $q->whereHas('lead', fn($lq) => $lq->where('lead_type_id', $leadTypeIdFilter))
                      ->orWhereHas('student.lead', fn($slq) => $slq->where('lead_type_id', $leadTypeIdFilter));
                });
            }

            return $query;
        };

        // Base Query for Paid Invoices within selected filter
        $paidInvoicesQuery = Invoice::where('status', 'paid');
        $pendingInvoicesQuery = Invoice::where('status', 'pending');

        if ($startDate && $endDate) {
            $paidInvoicesQuery->whereBetween('paid_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            $pendingInvoicesQuery->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        }

        $paidInvoicesQuery = $applyFilters($paidInvoicesQuery);
        $pendingInvoicesQuery = $applyFilters($pendingInvoicesQuery);

        $totalRevenue = (int) (clone $paidInvoicesQuery)->sum('total_amount');
        $totalPending = (int) (clone $pendingInvoicesQuery)->sum('total_amount');
        $totalDiscount = (int) (clone $paidInvoicesQuery)->sum('discount_amount');
        $paidCount = (clone $paidInvoicesQuery)->count();
        $averageOrderValue = $paidCount > 0 ? (int) round($totalRevenue / $paidCount) : 0;

        // Revenue by Student Type (New Join vs. Rejoin vs. Paket Lanjut) within selected filter
        $newJoinRevenue = (int) (clone $paidInvoicesQuery)->where(function($q) {
            $q->where('type', 'new_join')->orWhere(fn($sq) => $sq->whereNull('type')->whereNull('student_id'));
        })->sum('total_amount');

        $rejoinRevenue = (int) (clone $paidInvoicesQuery)->where(function($q) {
            $q->where('type', 'rejoin')->orWhere(fn($sq) => $sq->whereNull('type')->whereNotNull('student_id'));
        })->sum('total_amount');

        $paketLanjutRevenue = (int) (clone $paidInvoicesQuery)->where('type', 'paket_lanjut')->sum('total_amount');

        // Revenue by Class
        $classRevenue = (clone $paidInvoicesQuery)
            ->whereNotNull('study_class_id')
            ->with('studyClass')
            ->get()
            ->groupBy('study_class_id')
            ->map(function ($group) {
                return [
                    'class_name' => $group->first()->studyClass->name ?? 'Manual Item',
                    'total' => (int) $group->sum('total_amount'),
                    'count' => $group->count(),
                ];
            })
            ->values()
            ->sortByDesc('total')
            ->take(5)
            ->values();

        // Revenue by Price Master (Paket Harga)
        $priceMasterRevenue = (clone $paidInvoicesQuery)
            ->with(['items.priceMaster', 'studyClass.priceMaster'])
            ->get()
            ->flatMap(function ($invoice) {
                $itemsFound = false;
                $results = [];
                foreach ($invoice->items as $item) {
                    if ($item->price_master_id && $item->priceMaster) {
                        $itemsFound = true;
                        $results[] = [
                            'price_master_id' => $item->price_master_id,
                            'name' => $item->priceMaster->name,
                            'amount' => (int) $item->subtotal,
                        ];
                    }
                }
                if (!$itemsFound && $invoice->studyClass && $invoice->studyClass->priceMaster) {
                    $results[] = [
                        'price_master_id' => $invoice->studyClass->priceMaster->id,
                        'name' => $invoice->studyClass->priceMaster->name,
                        'amount' => (int) $invoice->total_amount,
                    ];
                }
                return $results;
            })
            ->groupBy('price_master_id')
            ->map(function ($group) {
                return [
                    'name' => $group->first()['name'],
                    'total' => (int) $group->sum('amount'),
                    'count' => $group->count(),
                ];
            })
            ->values()
            ->sortByDesc('total')
            ->values();

        // Monthly Trend (Last 6 Months)
        $monthlyTrend = collect();
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            $monthLabel = $monthStart->translatedFormat('F Y');

            $monthlySumQuery = Invoice::where('status', 'paid')
                ->whereBetween('paid_at', [$monthStart, $monthEnd]);
            $monthlySumQuery = $applyFilters($monthlySumQuery);

            $monthlyTrend->push([
                'month' => $monthLabel,
                'total' => (int) $monthlySumQuery->sum('total_amount'),
            ]);
        }

        // --- Daily Report (Harian) Query ---
        $dailyStart = \Carbon\Carbon::parse($dailyDate)->startOfDay();
        $dailyEnd = \Carbon\Carbon::parse($dailyDate)->endOfDay();

        $todayInvoicesQuery = Invoice::where('status', 'paid')
            ->where(function($q) use ($dailyStart, $dailyEnd) {
                $q->whereBetween('paid_at', [$dailyStart, $dailyEnd])
                  ->orWhere(function($sq) use ($dailyStart, $dailyEnd) {
                      $sq->whereNull('paid_at')->whereBetween('updated_at', [$dailyStart, $dailyEnd]);
                  });
            })
            ->with(['lead.leadType', 'student.lead.leadType', 'studyClass.branch', 'items']);

        $todayInvoicesQuery = $applyFilters($todayInvoicesQuery);

        if ($search) {
            $todayInvoicesQuery->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('lead', fn($l) => $l->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('student.lead', fn($l) => $l->where('name', 'like', "%{$search}%"));
            });
        }

        $todayPaidInvoices = $todayInvoicesQuery->latest('paid_at')->latest('updated_at')->get();
        $todayRevenue = (int) $todayPaidInvoices->sum('total_amount');

        // Month-to-date (So Far bulan ini: 1 s/d hari ini)
        $mtdStart = now()->startOfMonth();
        $mtdEnd = now()->endOfDay();
        $mtdQuery = Invoice::where('status', 'paid')->whereBetween('paid_at', [$mtdStart, $mtdEnd]);
        $mtdQuery = $applyFilters($mtdQuery);
        $mtdRevenue = (int) $mtdQuery->sum('total_amount');

        // Revenue by Payment Method (Kas & Bank / Akun Pembayaran)
        $paymentMethodRevenue = (clone $paidInvoicesQuery)
            ->whereNotNull('payment_method')
            ->selectRaw('payment_method, sum(total_amount) as total, count(*) as count')
            ->groupBy('payment_method')
            ->orderByDesc('total')
            ->get()
            ->map(function ($item) {
                return [
                    'payment_method' => $item->payment_method,
                    'total'          => (int) $item->total,
                    'count'          => (int) $item->count,
                ];
            });

        return Inertia::render('Admin/Finance/Reports/Index', [
            'filters' => [
                'tab' => $request->input('tab', 'summary'),
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $branchId ?? '',
                'type' => $typeFilter ?? '',
                'study_class_id' => $studyClassIdFilter ?? '',
                'price_master_id' => $priceMasterIdFilter ?? '',
                'lead_type_id' => $leadTypeIdFilter ?? '',
                'daily_date' => $dailyDate,
                'search' => $search ?? '',
            ],
            'branches' => \App\Domains\Master\Domain\Models\Branch::select('id', 'name')->get(),
            'studyClasses' => StudyClass::select('id', 'name', 'branch_id')->get(),
            'priceMasters' => PriceMaster::select('id', 'name')->orderBy('name')->get(),
            'leadTypes' => LeadType::select('id', 'name')->orderBy('name')->get(),
            'paymentAccounts' => \App\Domains\Finance\Domain\Models\PaymentAccount::where('is_active', true)->orderBy('type')->orderBy('name')->get(),
            'stats' => [
                'total_revenue' => $totalRevenue,
                'total_pending' => $totalPending,
                'total_discount' => $totalDiscount,
                'average_order_value' => $averageOrderValue,
                'new_join_revenue' => $newJoinRevenue,
                'rejoin_revenue' => $rejoinRevenue,
                'paket_lanjut_revenue' => $paketLanjutRevenue,
                'class_revenue' => $classRevenue,
                'price_master_revenue' => $priceMasterRevenue,
                'payment_method_revenue' => $paymentMethodRevenue,
                'monthly_trend' => $monthlyTrend,
                'today_revenue' => $todayRevenue,
                'mtd_revenue' => $mtdRevenue,
                'today_invoices' => $todayPaidInvoices,
            ]
        ]);
    }

    /**
     * Export Financial Report to PDF.
     */
    public function exportReportsPdf(Request $request)
    {
        $tab = $request->input('tab', 'summary');
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());
        $dailyDate = $request->input('daily_date', now()->toDateString());
        $branchId = $request->input('branch_id');
        $typeFilter = $request->input('type');
        $studyClassId = $request->input('study_class_id');
        $priceMasterIdFilter = $request->input('price_master_id');
        $leadTypeIdFilter = $request->input('lead_type_id');
        $search = $request->input('search');

        $branchName = 'Semua Cabang';
        if ($branchId) {
            $branch = \App\Domains\Master\Domain\Models\Branch::find($branchId);
            if ($branch) $branchName = $branch->name;
        }

        $applyFilters = function($query) use ($branchId, $typeFilter, $studyClassId, $priceMasterIdFilter, $leadTypeIdFilter) {
            if ($branchId) {
                $query->whereHas('studyClass', fn($q) => $q->where('branch_id', $branchId));
            }
            if ($typeFilter) {
                if ($typeFilter === 'new_join') {
                    $query->where(fn($q) => $q->where('type', 'new_join')->orWhere(fn($sq) => $sq->whereNull('type')->whereNull('student_id')));
                } elseif ($typeFilter === 'rejoin') {
                    $query->where(fn($q) => $q->where('type', 'rejoin')->orWhere(fn($sq) => $sq->whereNull('type')->whereNotNull('student_id')));
                } elseif ($typeFilter === 'placement_test') {
                    $query->where('type', 'placement_test');
                } else {
                    $query->where('type', $typeFilter);
                }
            }
            if ($studyClassId) {
                $query->where('study_class_id', $studyClassId);
            }
            if ($priceMasterIdFilter) {
                $query->where(function($q) use ($priceMasterIdFilter) {
                    $q->whereHas('items', fn($iq) => $iq->where('price_master_id', $priceMasterIdFilter))
                      ->orWhereHas('studyClass', fn($sq) => $sq->where('price_master_id', $priceMasterIdFilter));
                });
            }
            if ($leadTypeIdFilter) {
                $query->where(function($q) use ($leadTypeIdFilter) {
                    $q->whereHas('lead', fn($lq) => $lq->where('lead_type_id', $leadTypeIdFilter))
                      ->orWhereHas('student.lead', fn($slq) => $slq->where('lead_type_id', $leadTypeIdFilter));
                });
            }
            return $query;
        };

        if ($tab === 'daily') {
            $dailyStart = \Carbon\Carbon::parse($dailyDate)->startOfDay();
            $dailyEnd = \Carbon\Carbon::parse($dailyDate)->endOfDay();

            $query = Invoice::where('status', 'paid')
                ->where(function($q) use ($dailyStart, $dailyEnd) {
                    $q->whereBetween('paid_at', [$dailyStart, $dailyEnd])
                      ->orWhere(function($sq) use ($dailyStart, $dailyEnd) {
                          $sq->whereNull('paid_at')->whereBetween('updated_at', [$dailyStart, $dailyEnd]);
                      });
                })
                ->with(['lead', 'student.lead', 'studyClass.branch', 'items']);

            $query = $applyFilters($query);

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
                      ->orWhereHas('lead', fn($l) => $l->where('name', 'like', "%{$search}%"))
                      ->orWhereHas('student.lead', fn($l) => $l->where('name', 'like', "%{$search}%"));
                });
            }

            $todayPaidInvoices = $query->latest('paid_at')->latest('updated_at')->get();
            $todayRevenue = (int) $todayPaidInvoices->sum('total_amount');
            $periodLabel = \Carbon\Carbon::parse($dailyDate)->translatedFormat('d F Y');

            $stats = [
                'total_revenue' => $todayRevenue,
                'today_revenue' => $todayRevenue,
                'today_invoices' => $todayPaidInvoices,
            ];

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.financial-report-daily', compact('stats', 'branchName', 'periodLabel', 'dailyDate'));
            return $pdf->stream("Laporan-Pendapatan-Harian-{$dailyDate}.pdf");
        }

        // Summary PDF Export
        $paidInvoicesQuery = Invoice::where('status', 'paid');
        $pendingInvoicesQuery = Invoice::where('status', 'pending');

        if ($startDate && $endDate) {
            $paidInvoicesQuery->whereBetween('paid_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            $pendingInvoicesQuery->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        }

        $paidInvoicesQuery = $applyFilters($paidInvoicesQuery);
        $pendingInvoicesQuery = $applyFilters($pendingInvoicesQuery);

        $totalRevenue = (int) (clone $paidInvoicesQuery)->sum('total_amount');
        $totalPending = (int) (clone $pendingInvoicesQuery)->sum('total_amount');
        $totalDiscount = (int) (clone $paidInvoicesQuery)->sum('discount_amount');
        $paidCount = (clone $paidInvoicesQuery)->count();
        $averageOrderValue = $paidCount > 0 ? (int) round($totalRevenue / $paidCount) : 0;

        $newJoinRevenue = (int) (clone $paidInvoicesQuery)->where(function($q) {
            $q->where('type', 'new_join')->orWhere(fn($sq) => $sq->whereNull('type')->whereNull('student_id'));
        })->sum('total_amount');

        $rejoinRevenue = (int) (clone $paidInvoicesQuery)->where(function($q) {
            $q->where('type', 'rejoin')->orWhere(fn($sq) => $sq->whereNull('type')->whereNotNull('student_id'));
        })->sum('total_amount');

        $paketLanjutRevenue = (int) (clone $paidInvoicesQuery)->where('type', 'paket_lanjut')->sum('total_amount');

        // Revenue by Price Master (Paket Harga)
        $priceMasterRevenue = (clone $paidInvoicesQuery)
            ->with(['items.priceMaster', 'studyClass.priceMaster'])
            ->get()
            ->flatMap(function ($invoice) {
                $itemsFound = false;
                $results = [];
                foreach ($invoice->items as $item) {
                    if ($item->price_master_id && $item->priceMaster) {
                        $itemsFound = true;
                        $results[] = [
                            'name' => $item->priceMaster->name,
                            'amount' => (int) $item->subtotal,
                        ];
                    }
                }
                if (!$itemsFound && $invoice->studyClass && $invoice->studyClass->priceMaster) {
                    $results[] = [
                        'name' => $invoice->studyClass->priceMaster->name,
                        'amount' => (int) $invoice->total_amount,
                    ];
                }
                return $results;
            })
            ->groupBy('name')
            ->map(function ($group, $name) {
                return [
                    'name' => $name,
                    'total' => (int) $group->sum('amount'),
                    'count' => $group->count(),
                ];
            })
            ->values()
            ->sortByDesc('total')
            ->values();

        $periodPaidInvoices = (clone $paidInvoicesQuery)
            ->with(['lead.leadType', 'student.lead.leadType', 'studyClass.branch', 'items'])
            ->latest('paid_at')
            ->get();

        $todayStart = now()->startOfDay();
        $todayEnd = now()->endOfDay();
        $todayPaidInvoices = $applyFilters(
            Invoice::where('status', 'paid')
                ->whereBetween('paid_at', [$todayStart, $todayEnd])
                ->with(['lead', 'student.lead', 'studyClass.branch'])
        )->latest('paid_at')->get();
        $todayRevenue = (int) $todayPaidInvoices->sum('total_amount');

        $mtdStart = now()->startOfMonth();
        $mtdEnd = now()->endOfDay();
        $mtdRevenue = (int) $applyFilters(
            Invoice::where('status', 'paid')->whereBetween('paid_at', [$mtdStart, $mtdEnd])
        )->sum('total_amount');

        $periodLabel = \Carbon\Carbon::parse($startDate)->translatedFormat('d M Y') . ' - ' . \Carbon\Carbon::parse($endDate)->translatedFormat('d M Y');

        // Resolve filter labels
        $className = 'Semua Kelas';
        if ($studyClassId) {
            $sc = StudyClass::find($studyClassId);
            if ($sc) $className = $sc->name;
        }

        $priceMasterName = 'Semua Paket';
        if ($priceMasterIdFilter) {
            $pm = PriceMaster::find($priceMasterIdFilter);
            if ($pm) $priceMasterName = $pm->name;
        }

        $leadTypeName = 'Semua Type Lead';
        if ($leadTypeIdFilter) {
            $lt = \App\Domains\Master\Domain\Models\LeadType::find($leadTypeIdFilter);
            if ($lt) $leadTypeName = $lt->name;
        }

        $typeName = 'Semua Tipe';
        if ($typeFilter) {
            $typeNameMap = [
                'new_join' => 'New Join',
                'rejoin' => 'Rejoin',
                'paket_lanjut' => 'Paket Lanjut',
                'placement_test' => 'Placement Test',
            ];
            $typeName = $typeNameMap[$typeFilter] ?? $typeFilter;
        }

        // Revenue by Payment Method (Kas & Bank / Akun Pembayaran)
        $paymentMethodRevenue = (clone $paidInvoicesQuery)
            ->whereNotNull('payment_method')
            ->selectRaw('payment_method, sum(total_amount) as total, count(*) as count')
            ->groupBy('payment_method')
            ->orderByDesc('total')
            ->get()
            ->map(function ($item) {
                return [
                    'payment_method' => $item->payment_method,
                    'total'          => (int) $item->total,
                    'count'          => (int) $item->count,
                ];
            });

        $stats = [
            'total_revenue' => $totalRevenue,
            'total_pending' => $totalPending,
            'total_discount' => $totalDiscount,
            'average_order_value' => $averageOrderValue,
            'new_join_revenue' => $newJoinRevenue,
            'rejoin_revenue' => $rejoinRevenue,
            'paket_lanjut_revenue' => $paketLanjutRevenue,
            'price_master_revenue' => $priceMasterRevenue,
            'payment_method_revenue' => $paymentMethodRevenue,
            'today_revenue' => $todayRevenue,
            'mtd_revenue' => $mtdRevenue,
            'today_invoices' => $todayPaidInvoices,
            'period_invoices' => $periodPaidInvoices,
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.financial-report', compact(
            'stats', 'branchName', 'periodLabel', 'className', 'priceMasterName', 'leadTypeName', 'typeName'
        ));
        return $pdf->stream("Laporan-Keuangan-Summary-{$startDate}-to-{$endDate}.pdf");
    }

    /**
     * Export Financial Report / Paid Transactions to Excel (CSV compatible).
     */
    public function exportReportsExcel(Request $request)
    {
        $tab = $request->input('tab', 'summary');
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());
        $dailyDate = $request->input('daily_date', now()->toDateString());
        $branchId = $request->input('branch_id');
        $typeFilter = $request->input('type');
        $studyClassId = $request->input('study_class_id');
        $priceMasterIdFilter = $request->input('price_master_id');
        $leadTypeIdFilter = $request->input('lead_type_id');
        $search = $request->input('search');

        $query = Invoice::where('status', 'paid')
            ->with(['lead.leadType', 'student.lead.leadType', 'studyClass.branch']);

        if ($tab === 'daily') {
            $dailyStart = \Carbon\Carbon::parse($dailyDate)->startOfDay();
            $dailyEnd = \Carbon\Carbon::parse($dailyDate)->endOfDay();
            $query->where(function($q) use ($dailyStart, $dailyEnd) {
                $q->whereBetween('paid_at', [$dailyStart, $dailyEnd])
                  ->orWhere(function($sq) use ($dailyStart, $dailyEnd) {
                      $sq->whereNull('paid_at')->whereBetween('updated_at', [$dailyStart, $dailyEnd]);
                  });
            });
            $filename = "Laporan-Pendapatan-Harian-{$dailyDate}.csv";
        } else {
            $query->whereBetween('paid_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            $filename = "Laporan-Keuangan-Summary-{$startDate}-to-{$endDate}.csv";
        }

        if ($branchId) {
            $query->whereHas('studyClass', fn($q) => $q->where('branch_id', $branchId));
        }

        if ($typeFilter) {
            if ($typeFilter === 'new_join') {
                $query->where(fn($q) => $q->where('type', 'new_join')->orWhere(fn($sq) => $sq->whereNull('type')->whereNull('student_id')));
            } elseif ($typeFilter === 'rejoin') {
                $query->where(fn($q) => $q->where('type', 'rejoin')->orWhere(fn($sq) => $sq->whereNull('type')->whereNotNull('student_id')));
            } elseif ($typeFilter === 'placement_test') {
                $query->where('type', 'placement_test');
            } else {
                $query->where('type', $typeFilter);
            }
        }

        if ($studyClassId) {
            $query->where('study_class_id', $studyClassId);
        }

        if ($priceMasterIdFilter) {
            $query->where(function($q) use ($priceMasterIdFilter) {
                $q->whereHas('items', fn($iq) => $iq->where('price_master_id', $priceMasterIdFilter))
                  ->orWhereHas('studyClass', fn($sq) => $sq->where('price_master_id', $priceMasterIdFilter));
            });
        }

        if ($leadTypeIdFilter) {
            $query->where(function($q) use ($leadTypeIdFilter) {
                $q->whereHas('lead', fn($lq) => $lq->where('lead_type_id', $leadTypeIdFilter))
                  ->orWhereHas('student.lead', fn($slq) => $slq->where('lead_type_id', $leadTypeIdFilter));
            });
        }

        if ($tab === 'daily' && $search) {
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('lead', fn($l) => $l->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('student.lead', fn($l) => $l->where('name', 'like', "%{$search}%"));
            });
        }

        $invoices = $query->latest('paid_at')->latest('updated_at')->get();

        $headers = [
            "Content-type" => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename={$filename}",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function() use ($invoices) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($file, ['No. Invoice', 'Tanggal Bayar', 'Tipe', 'Nama Pelanggan', 'Type Lead', 'No. HP', 'Kelas / Produk', 'Cabang', 'Metode Bayar', 'Diskon', 'Total Bayar']);

            foreach ($invoices as $inv) {
                $customerName = $inv->lead->name ?? ($inv->student->lead->name ?? 'Unknown');
                $leadTypeName = $inv->lead->leadType->name ?? ($inv->student->lead->leadType->name ?? '-');
                $phoneRaw = $inv->lead->phone ?? ($inv->student->lead->phone ?? '-');
                // Format phone number with leading single quote or non-breaking prefix so Excel treats it as text, preventing scientific notation
                $phone = ($phoneRaw !== '-' && !empty($phoneRaw)) ? "'" . $phoneRaw : '-';
                
                $branchName = $inv->studyClass->branch->name ?? '-';
                $className = $inv->studyClass->name ?? 'Manual Item';
                $typeLabel = $inv->type === 'new_join' ? 'New Join' : ($inv->type === 'rejoin' ? 'Rejoin' : ($inv->type === 'paket_lanjut' ? 'Paket Lanjut' : 'Placement Test'));
                $paymentMethod = $inv->payment_method ?: '-';
                $paidDate = $inv->paid_at ? \Carbon\Carbon::parse($inv->paid_at)->format('Y-m-d H:i') : ($inv->updated_at ? \Carbon\Carbon::parse($inv->updated_at)->format('Y-m-d H:i') : '-');

                fputcsv($file, [
                    $inv->invoice_number,
                    $paidDate,
                    $typeLabel,
                    $customerName,
                    $leadTypeName,
                    $phone,
                    $className,
                    $branchName,
                    $paymentMethod,
                    $inv->discount_amount,
                    $inv->total_amount
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}


