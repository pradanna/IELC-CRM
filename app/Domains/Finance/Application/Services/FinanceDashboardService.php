<?php

namespace App\Domains\Finance\Application\Services;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Domains\Finance\Domain\Models\Invoice;

class FinanceDashboardService
{
    /**
     * Get data for the finance dashboard.
     */
    public function getDashboardData(): array
    {
        $invoicePhase = LeadPhase::where('code', 'invoice')->first();
        $invoicePhaseId = $invoicePhase?->id ?? 'non-existent-id';

        $leadsForInvoicing = Lead::where('lead_phase_id', $invoicePhaseId)
            ->whereDoesntHave('student')
            ->with(['leadType', 'branch'])
            ->latest()
            ->get();

        $rejoinStudents = Student::where('status', 'stop')
            ->orWhereHas('studyClasses', function($q) {
                $q->whereBetween('end_session_date', [now()->toDateString(), now()->addDays(14)->toDateString()]);
            })
            ->with(['lead.branch', 'studyClasses' => fn($q) => $q->latest()->take(1)])
            ->latest()
            ->get();

        return [
            'leads' => $leadsForInvoicing,
            'rejoinStudents' => $rejoinStudents,
            'classes' => StudyClass::with(['branch', 'instructor', 'priceMaster'])->get(),
            'priceMasters' => PriceMaster::all(),
            'recentInvoices' => Invoice::with(['lead', 'student', 'studyClass'])->latest()->limit(10)->get(),
        ];
    }
}
