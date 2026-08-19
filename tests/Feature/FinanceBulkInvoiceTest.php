<?php

namespace Tests\Feature;

use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Finance\Domain\Models\Invoice;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Shared\Domain\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FinanceBulkInvoiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_bulk_invoice_generation_for_expiring_class(): void
    {
        // 1. Setup Roles & User
        $superadminRole = Role::create(['name' => 'superadmin']);
        $financeRole = Role::create(['name' => 'finance']);
        $user = User::factory()->create();
        $user->assignRole($financeRole);

        // 2. Setup master data
        $branch = Branch::create([
            'name' => 'Sudirman Branch',
            'code' => 'SDR',
        ]);
        
        $priceMaster = PriceMaster::create([
            'name' => 'Regular Package Rate',
            'price_per_session' => 1500000,
        ]);

        // 3. Setup Class ending in 5 days
        $studyClass = StudyClass::create([
            'branch_id' => $branch->id,
            'price_master_id' => $priceMaster->id,
            'name' => 'Expiring IELTS Class',
            'start_session_date' => Carbon::now()->subDays(15),
            'end_session_date' => Carbon::now()->addDays(5),
            'total_meetings' => 24,
            'meetings_per_week' => 2,
            'current_session_number' => 1,
            'schedule_days' => ['Monday', 'Wednesday'],
        ]);

        // 4. Setup Student & Lead
        $lead = Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'Jane Doe',
            'phone' => '081234567890',
            'email' => 'jane@example.com',
            'branch_id' => $branch->id,
            'owner_id' => $user->id,
        ]);

        $student = Student::create([
            'lead_id' => $lead->id,
            'student_number' => 'STU-1001',
            'start_join' => Carbon::now()->subMonths(1),
            'status' => 'active',
        ]);

        // Enroll Student
        $student->studyClasses()->attach($studyClass->id, [
            'lead_id' => $lead->id,
            'joined_at' => Carbon::now()->subMonths(1)->toDateString(),
            'status' => 'active',
        ]);

        // 5. Fire request as finance user
        $response = $this->actingAs($user)
            ->post(route('admin.finance.classes.bulk-invoice', $studyClass->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // 6. Assert Invoice Created
        $this->assertDatabaseHas('invoices', [
            'student_id' => $student->id,
            'study_class_id' => $studyClass->id,
            'status' => 'pending',
            'session_count' => 24,
            'total_amount' => 1500000,
        ]);

        // 7. Fire request again to assert duplicate skipping
        $secondResponse = $this->actingAs($user)
            ->post(route('admin.finance.classes.bulk-invoice', $studyClass->id));

        $secondResponse->assertRedirect();
        $secondResponse->assertSessionHas('success');

        // Total count should still be 1 (meaning it was skipped)
        $this->assertEquals(1, Invoice::where('student_id', $student->id)->count());
    }

    public function test_study_class_index_works_with_students_count_relationship(): void
    {
        $superadminRole = Role::create(['name' => 'superadmin']);
        $user = User::factory()->create();
        $user->assignRole($superadminRole);

        $branch = Branch::create([
            'name' => 'Sudirman Branch',
            'code' => 'SDR',
        ]);

        $studyClass = StudyClass::create([
            'branch_id' => $branch->id,
            'name' => 'Expiring IELTS Class',
            'start_session_date' => Carbon::now()->subDays(15),
            'end_session_date' => Carbon::now()->addDays(5),
            'total_meetings' => 24,
            'meetings_per_week' => 2,
            'current_session_number' => 1,
            'schedule_days' => ['Monday', 'Wednesday'],
        ]);

        $response = $this->actingAs($user)
            ->get(route('admin.academic.study-classes.index'));

        $response->assertOk();
    }
}
