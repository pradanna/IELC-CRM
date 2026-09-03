<?php

namespace Tests\Feature;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadRegistration;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\Master\Domain\Models\LeadSource;
use App\Domains\Master\Domain\Models\InfoSource;
use App\Domains\Master\Domain\Models\LeadType;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\Academic\Domain\Models\PtExam;
use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Domains\Finance\Domain\Models\Invoice;
use App\Domains\Finance\Application\Actions\ProcessInvoicePayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LeadToStudentFullLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Branch $branch;
    protected LeadPhase $leadPhase;
    protected LeadPhase $enrollmentPhase;
    protected LeadSource $leadSource;
    protected InfoSource $infoSource;
    protected LeadType $leadType;
    protected PriceMaster $priceMaster;
    protected StudyClass $studyClass;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'superadmin']);
        Role::create(['name' => 'frontdesk']);
        $this->admin = User::factory()->create();
        $this->admin->assignRole('superadmin');

        $this->branch = Branch::create(['name' => 'Griya Branch', 'code' => 'GRY']);

        $this->leadPhase = LeadPhase::create(['name' => 'Lead Baru', 'code' => 'lead', 'status' => 'prospective']);
        $this->enrollmentPhase = LeadPhase::create(['name' => 'Enrollment', 'code' => 'enrollment', 'status' => 'closing']);

        $this->leadSource = LeadSource::create(['name' => 'Website Self-Reg', 'code' => 'website']);
        $this->infoSource = InfoSource::create(['name' => 'Instagram', 'code' => 'instagram']);
        $this->leadType = LeadType::create(['name' => 'General English', 'code' => 'general_english']);

        $this->priceMaster = PriceMaster::create(['name' => 'Reguler Package', 'price_per_session' => 1200000]);
        $this->studyClass = StudyClass::create([
            'branch_id' => $this->branch->id,
            'price_master_id' => $this->priceMaster->id,
            'name' => 'GE-Elementary-1',
            'total_meetings' => 12,
            'meetings_per_week' => 2,
            'start_session_date' => now()->format('Y-m-d'),
            'end_session_date' => now()->addMonths(2)->format('Y-m-d'),
            'schedule_days' => ['senin', 'rabu'],
        ]);
    }

    public function test_full_lead_to_student_lifecycle_via_public_registration(): void
    {
        // STEP 1: Public Registration Submission
        $registrationData = [
            'name' => 'Budi Santoso',
            'nickname' => 'Budi',
            'phone' => '081234567890',
            'email' => 'budi.santoso@example.com',
            'gender' => 'L',
            'birth_date' => '2010-05-15',
            'branch_id' => $this->branch->id,
            'school' => 'SMP 1 Surakarta',
            'grade' => '7',
            'province' => 'Jawa Tengah',
            'city' => 'Surakarta',
            'address' => 'Jl. Slamet Riyadi No. 12',
            'postal_code' => '57111',
            'lead_source_id' => $this->leadSource->id,
            'info_source_id' => $this->infoSource->id,
            'guardian_data' => [
                'father_name' => 'Hendra Santoso',
                'father_phone' => '081987654321',
                'mother_name' => 'Siti Santoso',
                'mother_phone' => '081987654322',
            ]
        ];

        $response = $this->post(route('public.join.store'), $registrationData);
        $response->assertSessionHasNoErrors();

        // Verify LeadRegistration record is created with status 'pending'
        $this->assertDatabaseHas('lead_registrations', [
            'name' => 'Budi Santoso',
            'phone' => '081234567890',
            'status' => 'pending',
        ]);

        $registration = LeadRegistration::where('phone', '081234567890')->first();
        $this->assertNotNull($registration);

        // STEP 2: Admin approves Lead Registration
        $this->actingAs($this->admin);
        app(\App\Domains\CRM\Application\Actions\Leads\ApproveLeadRegistration::class)->handle($registration, $this->branch->id);

        // Verify Lead is created and registration is approved
        $registration->refresh();
        $this->assertEquals('approved', $registration->status);

        $lead = Lead::where('phone', '081234567890')->first();
        $this->assertNotNull($lead);
        $this->assertEquals('Budi Santoso', $lead->name);
        $this->assertEquals('budi.santoso@example.com', $lead->email);
        $this->assertCount(2, $lead->guardians); // Ayah & Ibu

        // STEP 3: Record Lead Follow-Up
        $followUpResponse = $this->patchJson(route('admin.crm.leads.record-followup', $lead->id), [
            'notes' => 'Lead tertarik mengambil kelas General English.',
            'next_follow_up' => now()->addDays(2)->format('Y-m-d H:i:s'),
        ]);
        $followUpResponse->assertStatus(200);

        $lead->refresh();
        $this->assertEquals(1, $lead->follow_up_count);

        // STEP 4: Store Lead Consultation
        $consultationResponse = $this->postJson(route('admin.crm.leads.store-consultation', $lead->id), [
            'consultation_date' => now()->format('Y-m-d'),
            'notes' => 'Hasil konsultasi: disarankan placement test terlebih dahulu.',
            'consultant_id' => $this->admin->id,
        ]);
        $consultationResponse->assertStatus(200);
        $this->assertDatabaseHas('lead_consultations', [
            'lead_id' => $lead->id,
            'notes' => 'Hasil konsultasi: disarankan placement test terlebih dahulu.',
        ]);

        // STEP 5: Plot Class and Generate Invoice
        $startDate = now()->addDays(3)->format('Y-m-d');
        $invoiceResponse = $this->postJson(route('admin.crm.leads.plot-class', $lead->id), [
            'study_class_id' => $this->studyClass->id,
            'join_date' => $startDate,
            'start_date' => $startDate,
        ]);
        $invoiceResponse->assertStatus(200);

        $invoice = app(\App\Domains\Finance\Application\Actions\GenerateInvoice::class)->handle([
            'lead_id' => $lead->id,
            'study_class_id' => $this->studyClass->id,
            'price_master_id' => $this->priceMaster->id,
            'join_date' => $startDate,
        ]);

        // Verify pending invoice created
        $invoice = Invoice::where('lead_id', $lead->id)->first();
        $this->assertNotNull($invoice);
        $this->assertEquals($this->studyClass->id, $invoice->study_class_id);
        $this->assertEquals('pending', $invoice->status);

        // STEP 6: Process Payment for Invoice -> Triggers Lead Promotion to Student
        app(ProcessInvoicePayment::class)->handle($invoice);

        // STEP 7: Verification of Student creation & Lead Enrollment
        $lead->refresh();
        $this->assertEquals('enrollment', $lead->leadPhase->code);
        $this->assertNotNull($lead->student);

        $student = $lead->student;
        $this->assertStringStartsWith('STU-' . now()->year, $student->student_number);
        $this->assertEquals('active', $student->status);

        $enrollment = LeadEnrollment::where('lead_id', $lead->id)->first();
        $this->assertNotNull($enrollment);
        $this->assertEquals($student->id, $enrollment->student_id);
        $this->assertEquals($this->studyClass->id, $enrollment->study_class_id);
        $this->assertEquals('active', $enrollment->status);
    }
}
