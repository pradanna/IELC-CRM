<?php

namespace Tests\Feature;

use App\Domains\Academic\Domain\Models\ClassAttendance;
use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\Finance\Domain\Models\Invoice;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Shared\Domain\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentClassTransferWithInvoiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $staffUser;
    protected User $financeUser;
    protected Branch $branch;
    protected PriceMaster $priceMaster;

    protected function setUp(): void
    {
        parent::setUp();

        Role::findOrCreate('superadmin');
        Role::findOrCreate('it_staff');
        Role::findOrCreate('frontdesk');
        Role::findOrCreate('finance');

        $this->branch = Branch::create(['name' => 'Solo Branch', 'code' => 'solo']);

        $this->priceMaster = PriceMaster::create([
            'name' => 'Regular Package 24',
            'price_per_session' => 2400000,
            'total_sessions' => 24,
        ]);

        $this->staffUser = User::factory()->create(['branch_id' => $this->branch->id]);
        $this->staffUser->assignRole('frontdesk');

        $this->financeUser = User::factory()->create(['branch_id' => $this->branch->id]);
        $this->financeUser->assignRole('finance');
    }

    private function createStudentWithEnrolledClass(StudyClass $class): Student
    {
        $lead = Lead::create([
            'name' => 'Budi Siswa',
            'phone' => '081234567890',
            'branch_id' => $this->branch->id,
            'owner_id' => $this->staffUser->id,
            'lead_number' => 'LD-' . uniqid(),
        ]);

        $student = Student::create([
            'lead_id' => $lead->id,
            'student_number' => 'STU-' . uniqid(),
            'status' => 'active',
            'start_join' => now()->subMonth()->toDateString(),
        ]);

        LeadEnrollment::create([
            'lead_id' => $lead->id,
            'student_id' => $student->id,
            'study_class_id' => $class->id,
            'joined_at' => now()->subMonth()->toDateString(),
            'end_date' => $class->end_session_date?->toDateString(),
            'status' => 'active',
            'cycle_number' => 1,
        ]);

        return $student;
    }

    public function test_transfer_preview_calculates_difference_correctly(): void
    {
        // Source Class: Private 24 total, manual progress = 14 (10 remaining)
        $fromClass = StudyClass::create([
            'name' => 'Private A',
            'branch_id' => $this->branch->id,
            'price_master_id' => $this->priceMaster->id,
            'category' => 'private',
            'type' => 'offline',
            'total_meetings' => 24,
            'manual_session_progress' => 14,
            'status' => 'active',
        ]);

        // Target Class: Private 24 total, manual progress = 6 (18 remaining)
        $toClass = StudyClass::create([
            'name' => 'Private B',
            'branch_id' => $this->branch->id,
            'price_master_id' => $this->priceMaster->id,
            'category' => 'private',
            'type' => 'offline',
            'total_meetings' => 24,
            'manual_session_progress' => 6,
            'status' => 'active',
        ]);

        $student = $this->createStudentWithEnrolledClass($fromClass);

        $response = $this->actingAs($this->staffUser)->getJson(route('admin.academic.students.transfer-preview', [
            'student' => $student->id,
            'from_study_class_id' => $fromClass->id,
            'to_study_class_id' => $toClass->id,
            'effective_date' => now()->toDateString(),
        ]));

        $response->assertStatus(200);
        $response->assertJson([
            'from_remaining' => 10,
            'to_remaining' => 18,
            'difference_sessions' => 8,
            'requires_invoice' => true,
            'price_per_session' => 100000,
            'invoice_amount' => 800000,
        ]);
    }

    public function test_transfer_creates_invoice_when_target_class_has_longer_duration(): void
    {
        // Source Class: 10 sessions remaining
        $fromClass = StudyClass::create([
            'name' => 'Source Class',
            'branch_id' => $this->branch->id,
            'price_master_id' => $this->priceMaster->id,
            'category' => 'private',
            'type' => 'offline',
            'total_meetings' => 24,
            'manual_session_progress' => 14,
            'status' => 'active',
        ]);

        // Target Class: 16 sessions remaining
        $toClass = StudyClass::create([
            'name' => 'Target Class Longer',
            'branch_id' => $this->branch->id,
            'price_master_id' => $this->priceMaster->id,
            'category' => 'private',
            'type' => 'offline',
            'total_meetings' => 24,
            'manual_session_progress' => 8,
            'status' => 'active',
        ]);

        $student = $this->createStudentWithEnrolledClass($fromClass);

        // Perform Transfer
        $response = $this->actingAs($this->staffUser)->post(route('admin.academic.students.transfer-class', $student->id), [
            'from_study_class_id' => $fromClass->id,
            'to_study_class_id' => $toClass->id,
            'effective_date' => now()->toDateString(),
            'reason' => 'Upgrade to longer class',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Verify Source Enrollment is stopped
        $this->assertDatabaseHas('lead_enrollments', [
            'student_id' => $student->id,
            'study_class_id' => $fromClass->id,
            'status' => 'stopped',
        ]);

        // Verify Target Enrollment is active
        $this->assertDatabaseHas('lead_enrollments', [
            'student_id' => $student->id,
            'study_class_id' => $toClass->id,
            'status' => 'active',
        ]);

        // Verify Invoice is created for 6 extra sessions (16 - 10 = 6)
        // Rate: 2.400.000 / 24 = 100.000 / session => 6 * 100.000 = 600.000
        $this->assertDatabaseHas('invoices', [
            'student_id' => $student->id,
            'study_class_id' => $toClass->id,
            'total_amount' => 600000,
            'session_count' => 6,
            'status' => 'pending',
            'type' => 'transfer_class',
        ]);

        $invoice = Invoice::where('student_id', $student->id)->where('study_class_id', $toClass->id)->first();
        $this->assertNotNull($invoice);
        $this->assertCount(1, $invoice->items);
        $this->assertEquals(600000, $invoice->items->first()->subtotal);
    }

    public function test_transfer_does_not_create_invoice_when_target_class_has_shorter_or_equal_duration(): void
    {
        // Source Class: 18 sessions remaining
        $fromClass = StudyClass::create([
            'name' => 'Source Class',
            'branch_id' => $this->branch->id,
            'price_master_id' => $this->priceMaster->id,
            'category' => 'private',
            'type' => 'offline',
            'total_meetings' => 24,
            'manual_session_progress' => 6,
            'status' => 'active',
        ]);

        // Target Class: 10 sessions remaining (shorter duration)
        $toClass = StudyClass::create([
            'name' => 'Target Class Shorter',
            'branch_id' => $this->branch->id,
            'price_master_id' => $this->priceMaster->id,
            'category' => 'private',
            'type' => 'offline',
            'total_meetings' => 24,
            'manual_session_progress' => 14,
            'status' => 'active',
        ]);

        $student = $this->createStudentWithEnrolledClass($fromClass);

        // Perform Transfer
        $response = $this->actingAs($this->staffUser)->post(route('admin.academic.students.transfer-class', $student->id), [
            'from_study_class_id' => $fromClass->id,
            'to_study_class_id' => $toClass->id,
            'effective_date' => now()->toDateString(),
            'reason' => 'Downgrade or move schedule',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Verify Source Enrollment is stopped
        $this->assertDatabaseHas('lead_enrollments', [
            'student_id' => $student->id,
            'study_class_id' => $fromClass->id,
            'status' => 'stopped',
        ]);

        // Verify Target Enrollment is active
        $this->assertDatabaseHas('lead_enrollments', [
            'student_id' => $student->id,
            'study_class_id' => $toClass->id,
            'status' => 'active',
        ]);

        // Verify NO invoice was created
        $this->assertDatabaseMissing('invoices', [
            'student_id' => $student->id,
            'study_class_id' => $toClass->id,
        ]);
    }

    public function test_finance_role_can_perform_transfer_and_preview(): void
    {
        $fromClass = StudyClass::create([
            'name' => 'Class Alpha',
            'branch_id' => $this->branch->id,
            'price_master_id' => $this->priceMaster->id,
            'category' => 'private',
            'type' => 'offline',
            'total_meetings' => 24,
            'manual_session_progress' => 5,
            'status' => 'active',
        ]);

        $toClass = StudyClass::create([
            'name' => 'Class Beta',
            'branch_id' => $this->branch->id,
            'price_master_id' => $this->priceMaster->id,
            'category' => 'private',
            'type' => 'offline',
            'total_meetings' => 24,
            'manual_session_progress' => 0,
            'status' => 'active',
        ]);

        $student = $this->createStudentWithEnrolledClass($fromClass);

        // 1. Finance can preview
        $previewRes = $this->actingAs($this->financeUser)->getJson(route('admin.academic.students.transfer-preview', [
            'student' => $student->id,
            'from_study_class_id' => $fromClass->id,
            'to_study_class_id' => $toClass->id,
        ]));
        $previewRes->assertStatus(200);
        $previewRes->assertJsonPath('requires_invoice', true);

        // 2. Finance can transfer class
        $transferRes = $this->actingAs($this->financeUser)->post(route('admin.academic.students.transfer-class', $student->id), [
            'from_study_class_id' => $fromClass->id,
            'to_study_class_id' => $toClass->id,
            'effective_date' => now()->toDateString(),
            'reason' => 'Transfer by finance',
        ]);
        $transferRes->assertRedirect();
        $this->assertDatabaseHas('lead_enrollments', [
            'student_id' => $student->id,
            'study_class_id' => $toClass->id,
            'status' => 'active',
        ]);
    }
}
