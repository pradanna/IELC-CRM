<?php

namespace App\Domains\Finance\Application\Services;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Domains\Finance\Domain\Models\Invoice;
use App\Http\Resources\Academic\StudyClassResource;

class FinanceDashboardService
{
    /**
     * Get data for the finance dashboard.
     */
    public function getDashboardData(): array
    {
        $invoicePhase = LeadPhase::where('code', 'invoice')->first();
        $invoicePhaseId = $invoicePhase?->id ?? 'non-existent-id';

        $ptPhaseIds = LeadPhase::where(function($q) {
            $q->whereIn('code', ['placement-test', 'placement_test', 'pt'])
              ->orWhere('name', 'like', '%placement%');
        })->pluck('id');

        $placementTestLeads = Lead::whereIn('lead_phase_id', $ptPhaseIds)
            ->whereDoesntHave('student')
            ->with(['leadType', 'branch', 'leadPhase', 'leadRelationships', 'relatedLeads'])
            ->withCount(['invoices as pending_invoices_count' => function($q) {
                $q->whereNull('student_id')
                  ->where('status', 'pending');
            }])
            ->latest()
            ->get();

        $leadsForInvoicing = Lead::where('lead_phase_id', $invoicePhaseId)
            ->whereDoesntHave('student')
            ->with(['leadType', 'branch', 'leadPhase', 'leadRelationships', 'relatedLeads'])
            ->withCount(['invoices as pending_invoices_count' => function($q) {
                $q->whereNull('student_id')
                  ->where('status', 'pending');
            }])
            ->latest()
            ->get();

        $rejoinStudents = Student::where('status', 'stop')
            ->with([
                'lead.branch', 
                'lead.relatedLeads',
                'studyClasses' => fn($q) => $q->latest()->take(1),
                'loyaltyRewards' => fn($q) => $q->where('is_used', false)
            ])
            ->latest()
            ->get();

        $paketLanjutStudents = Student::where('status', 'active')
            ->whereHas('studyClasses', function($q) {
                $q->whereBetween('end_session_date', [now()->toDateString(), now()->addDays(14)->toDateString()]);
            })
            ->with([
                'lead.branch', 
                'lead.relatedLeads',
                'studyClasses' => fn($q) => $q->latest()->take(1),
                'loyaltyRewards' => fn($q) => $q->where('is_used', false)
            ])
            ->latest()
            ->get();

        return [
            'leads' => $leadsForInvoicing,
            'placementTestLeads' => $placementTestLeads,
            'rejoinStudents' => $rejoinStudents,
            'paketLanjutStudents' => $paketLanjutStudents,
            'expiringClasses' => StudyClassResource::collection(
                StudyClass::whereBetween('end_session_date', [now()->toDateString(), now()->addDays(14)->toDateString()])
                    ->with(['branch', 'instructor', 'priceMaster', 'students.lead'])
                    ->withCount(['invoices as pending_bulk_invoices_count' => function($q) {
                        $q->whereNotNull('student_id')
                          ->whereNotIn('status', ['cancelled']);
                    }])
                    ->latest()
                    ->get()
            ),
            'classes' => StudyClassResource::collection(StudyClass::with(['branch', 'instructor', 'priceMaster'])->get()),
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
            'recentInvoices' => Invoice::with(['lead', 'student', 'studyClass'])->latest()->limit(10)->get(),
        ];
    }
}
