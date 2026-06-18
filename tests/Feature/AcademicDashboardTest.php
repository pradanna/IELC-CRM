<?php

namespace Tests\Feature;

use App\Domains\Academic\Domain\Models\Student;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\LeadType;
use App\Domains\Shared\Domain\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AcademicDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_academic_dashboard_page_can_be_accessed_by_superadmin(): void
    {
        // 1. Setup role & user
        $superadminRole = Role::create(['name' => 'superadmin']);
        $user = User::factory()->create();
        $user->assignRole($superadminRole);

        // 2. Setup branch and student type
        $branch = Branch::create([
            'name' => 'Sudirman Branch',
            'code' => 'SDR',
        ]);
        
        $leadType = LeadType::create([
            'name' => 'Regular Program',
            'code' => 'regular',
        ]);

        // 3. Setup student
        $lead = Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'John Doe',
            'phone' => '081234567890',
            'email' => 'john@example.com',
            'branch_id' => $branch->id,
            'lead_type_id' => $leadType->id,
            'owner_id' => $user->id,
            'grade' => 'SMA',
            'is_online' => false,
        ]);

        $student = Student::create([
            'lead_id' => $lead->id,
            'student_number' => 'STU-2026-0001',
            'start_join' => Carbon::now()->subDays(5),
            'status' => 'active',
        ]);

        // 4. Access academic dashboard
        $response = $this->actingAs($user)
            ->get(route('admin.academic.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Academic/Dashboard')
            ->has('filters')
            ->has('filters.year')
            ->has('filters.available_years')
            ->has('reports.overall')
            ->has('reports.join_patterns')
            ->has('reports.siswa_stop')
            ->has('reports.grades')
        );

        // 5. Test with year/month filter params
        $filteredResponse = $this->actingAs($user)
            ->get(route('admin.academic.index', ['year' => now()->year, 'month' => now()->month, 'tab' => 'join_patterns']));

        $filteredResponse->assertOk();
        $filteredResponse->assertInertia(fn ($page) => $page
            ->component('Admin/Academic/Dashboard')
            ->where('filters.year', (int) now()->year)
            ->where('filters.month', (int) now()->month)
            ->where('filters.tab', 'join_patterns')
        );
    }

    public function test_student_status_update_toggles_stopped_at_field(): void
    {
        // 1. Setup role & user
        $superadminRole = Role::create(['name' => 'superadmin']);
        $user = User::factory()->create();
        $user->assignRole($superadminRole);

        // 2. Setup student
        $branch = Branch::create([
            'name' => 'Sudirman Branch',
            'code' => 'SDR',
        ]);

        $lead = Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'Jane Doe',
            'phone' => '081234567891',
            'branch_id' => $branch->id,
            'owner_id' => $user->id,
        ]);

        $student = Student::create([
            'lead_id' => $lead->id,
            'student_number' => 'STU-2026-0002',
            'start_join' => Carbon::now()->subDays(10),
            'status' => 'active',
        ]);

        // 3. Update status to stop
        $response = $this->actingAs($user)
            ->put(route('admin.academic.students.update', $student->id), [
                'status' => 'stop',
                'notes' => 'Decided to take a break',
                'start_join' => $student->start_join->format('Y-m-d'),
            ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $student->refresh();
        $this->assertEquals('stop', $student->status);
        $this->assertNotNull($student->stopped_at);

        // 4. Update status back to active
        $response2 = $this->actingAs($user)
            ->put(route('admin.academic.students.update', $student->id), [
                'status' => 'active',
                'notes' => 'Returned back to active study',
                'start_join' => $student->start_join->format('Y-m-d'),
            ]);

        $response2->assertRedirect();
        $response2->assertSessionHasNoErrors();

        $student->refresh();
        $this->assertEquals('active', $student->status);
        $this->assertNull($student->stopped_at);
    }
}
