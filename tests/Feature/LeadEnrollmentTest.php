<?php

namespace Tests\Feature;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Domains\Finance\Domain\Models\Invoice;
use App\Domains\Finance\Application\Actions\ProcessInvoicePayment;
use App\Domains\CRM\Application\Actions\Leads\FetchCrmDashboardData;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LeadEnrollmentTest extends TestCase
{
    use RefreshDatabase, WithoutMiddleware;

    protected User $user;
    protected Branch $branch;
    protected Lead $lead;
    protected StudyClass $studyClass;
    protected PriceMaster $priceMaster;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'superadmin']);
        $this->user = User::factory()->create();
        $this->user->assignRole('superadmin');

        $this->branch = Branch::create(['name' => 'Sudirman Branch', 'code' => 'SDR']);
        
        $prospectPhase = LeadPhase::create(['name' => 'Prospect', 'code' => 'prospect', 'status' => 'prospective']);
        $enrollmentPhase = LeadPhase::create(['name' => 'Enrollment', 'code' => 'enrollment', 'status' => 'closing']);

        $this->lead = Lead::create([
            'name' => 'Test Lead',
            'nickname' => 'TL',
            'phone' => '08123456789',
            'branch_id' => $this->branch->id,
            'owner_id' => $this->user->id,
            'lead_phase_id' => $prospectPhase->id,
            'lead_number' => 'L-' . uniqid(),
        ]);

        $this->priceMaster = PriceMaster::create(['name' => 'General Package', 'price_per_session' => 1500000]);
        $this->studyClass = StudyClass::create([
            'branch_id' => $this->branch->id,
            'price_master_id' => $this->priceMaster->id,
            'name' => 'Test Class',
            'total_meetings' => 12,
            'meetings_per_week' => 2,
        ]);
    }

    public function test_paying_invoice_creates_enrollment_and_promotes_lead(): void
    {
        $startDate = now()->addDays(5)->format('Y-m-d');
        
        // 1. Create a pending invoice for the lead in a class
        $invoice = Invoice::create([
            'invoice_number' => 'INV-TEST-123',
            'lead_id' => $this->lead->id,
            'study_class_id' => $this->studyClass->id,
            'total_amount' => 1500000,
            'session_count' => 12,
            'start_date' => $startDate,
            'status' => 'pending',
            'type' => 'new_join',
        ]);

        // 2. Process invoice payment
        $this->actingAs($this->user);
        app(ProcessInvoicePayment::class)->handle($invoice);

        // 3. Verify student was created & lead phase is changed
        $this->lead->refresh();
        $this->assertNotNull($this->lead->student);
        $this->assertEquals('enrollment', $this->lead->leadPhase->code);

        // 4. Verify enrollment record is created
        $enrollments = LeadEnrollment::where('lead_id', $this->lead->id)->get();
        $this->assertCount(1, $enrollments);
        
        $enrollment = $enrollments->first();
        $this->assertEquals($this->studyClass->id, $enrollment->study_class_id);
        $this->assertEquals($invoice->id, $enrollment->invoice_id);
        $this->assertEquals($this->lead->student->id, $enrollment->student_id);
        $this->assertEquals($startDate, $enrollment->joined_at->format('Y-m-d'));
        $this->assertEquals('active', $enrollment->status);
        $this->assertEquals($this->studyClass->end_session_date?->format('Y-m-d'), $enrollment->end_date?->format('Y-m-d'));

        // 5. Verify the lead's enrolled_at is set for backward compatibility
        $this->assertEquals($startDate, $this->lead->enrolled_at->format('Y-m-d'));

        // 6. Verify dashboard calculations
        $dashboardData = app(FetchCrmDashboardData::class)->handle([
            'month' => now()->month,
            'year' => now()->year,
            'branch_id' => $this->branch->id,
        ]);

        // Success rate or enrollment counts should reflect the enrollment
        $phaseStats = collect($dashboardData['stats']['phases']);
        $enrollmentStat = $phaseStats->firstWhere('code', 'enrollment');
        
        $this->assertEquals(1, $enrollmentStat['count']);
    }

    public function test_paket_lanjut_invoice_does_not_create_lead_enrollment(): void
    {
        // Setup initial enrollment
        $invoice1 = Invoice::create([
            'invoice_number' => 'INV-TEST-001',
            'lead_id' => $this->lead->id,
            'study_class_id' => $this->studyClass->id,
            'total_amount' => 1500000,
            'session_count' => 12,
            'start_date' => now()->format('Y-m-d'),
            'status' => 'pending',
            'type' => 'new_join',
        ]);
        app(ProcessInvoicePayment::class)->handle($invoice1);

        $this->assertEquals(1, LeadEnrollment::where('lead_id', $this->lead->id)->count());

        // Now generate a paket_lanjut invoice for the existing active student
        $student = $this->lead->refresh()->student;
        $invoice2 = Invoice::create([
            'invoice_number' => 'INV-TEST-002',
            'lead_id' => $this->lead->id,
            'student_id' => $student->id,
            'study_class_id' => $this->studyClass->id,
            'total_amount' => 1500000,
            'session_count' => 12,
            'start_date' => now()->addDays(30)->format('Y-m-d'),
            'status' => 'pending',
            'type' => 'paket_lanjut',
        ]);
        app(ProcessInvoicePayment::class)->handle($invoice2);

        // Count should STILL be 1 (paket_lanjut does NOT add to lead_enrollments)
        $this->assertEquals(1, LeadEnrollment::where('lead_id', $this->lead->id)->count());
    }
}
